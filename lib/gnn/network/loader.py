"""
Road Network Loader from Supabase
Loads Nairobi roads data and converts to NetworkX graph
"""
import networkx as nx
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from supabase import create_client, Client
import os


@dataclass
class RoadSegment:
    """Road segment data from database"""
    id: str
    source_node_id: str
    target_node_id: str
    road_type: str
    length_meters: float
    speed_limit: Optional[int]
    one_way: bool
    name: Optional[str]
    geometry: Dict  # GeoJSON


@dataclass
class Node:
    """Intersection/node data from database"""
    id: str
    lat: float
    lng: float
    node_type: str
    name: Optional[str]


class RoadNetworkLoader:
    """Loads road network from Supabase and creates NetworkX graph"""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize Supabase client"""
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not provided")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        self._node_cache: Dict[str, Node] = {}
        self._graph_cache: Optional[nx.DiGraph] = None
    
    def load_nodes(self, bbox: Optional[Tuple[float, float, float, float]] = None) -> Dict[str, Node]:
        """
        Load nodes from database
        
        Args:
            bbox: Optional bounding box (min_lat, min_lng, max_lat, max_lng)
        
        Returns:
            Dictionary of node_id -> Node
        """
        query = self.client.table('nodes').select('*')
        
        # TODO: Add PostGIS bbox filtering when bbox is provided
        # For now, load all Nairobi nodes
        
        response = query.execute()
        
        nodes = {}
        for row in response.data:
            # Parse location from PostGIS POINT
            # Format: {"type": "Point", "coordinates": [lng, lat]}
            location = row.get('location')
            if location and isinstance(location, dict):
                coords = location.get('coordinates', [0, 0])
                lng, lat = coords[0], coords[1]
            else:
                # Fallback if location is in different format
                lat, lng = 0, 0
            
            nodes[row['id']] = Node(
                id=row['id'],
                lat=lat,
                lng=lng,
                node_type=row.get('node_type', 'intersection'),
                name=row.get('name')
            )
        
        self._node_cache = nodes
        return nodes

    def load_edges(self, bbox: Optional[Tuple[float, float, float, float]] = None) -> List[RoadSegment]:
        """
        Load road segments (edges) from database
        
        Args:
            bbox: Optional bounding box (min_lat, min_lng, max_lat, max_lng)
        
        Returns:
            List of RoadSegment objects
        """
        query = self.client.table('edges').select('*')
        
        # TODO: Add PostGIS bbox filtering
        
        response = query.execute()
        
        segments = []
        for row in response.data:
            segments.append(RoadSegment(
                id=row['id'],
                source_node_id=row['source_node_id'],
                target_node_id=row['target_node_id'],
                road_type=row.get('road_type', 'unknown'),
                length_meters=row.get('length_meters', 0),
                speed_limit=row.get('speed_limit'),
                one_way=row.get('one_way', False),
                name=row.get('name'),
                geometry=row.get('geometry', {})
            ))
        
        return segments
    
    def build_graph(self, bbox: Optional[Tuple[float, float, float, float]] = None, use_cache: bool = True) -> nx.DiGraph:
        """
        Build NetworkX directed graph from database
        
        Args:
            bbox: Optional bounding box to limit area
            use_cache: Whether to use cached graph
        
        Returns:
            NetworkX DiGraph with nodes and edges
        """
        # Check instance cache
        if use_cache and self._graph_cache is not None:
            return self._graph_cache
        
        # Load data
        nodes = self.load_nodes(bbox)
        edges = self.load_edges(bbox)
        
        # Create directed graph
        G = nx.DiGraph()
        
        # Add nodes with attributes
        for node_id, node in nodes.items():
            G.add_node(
                node_id,
                lat=node.lat,
                lng=node.lng,
                node_type=node.node_type,
                name=node.name
            )
        
        # Add edges with attributes
        for edge in edges:
            # Add forward edge
            G.add_edge(
                edge.source_node_id,
                edge.target_node_id,
                edge_id=edge.id,
                road_type=edge.road_type,
                length=edge.length_meters,
                speed_limit=edge.speed_limit or 50,  # Default 50 km/h
                name=edge.name,
                geometry=edge.geometry
            )
            
            # Add reverse edge if not one-way
            if not edge.one_way:
                G.add_edge(
                    edge.target_node_id,
                    edge.source_node_id,
                    edge_id=edge.id,
                    road_type=edge.road_type,
                    length=edge.length_meters,
                    speed_limit=edge.speed_limit or 50,
                    name=edge.name,
                    geometry=edge.geometry
                )
        
        self._graph_cache = G
        return G
    
    def find_nearest_node(self, lat: float, lng: float, graph: nx.DiGraph = None) -> Optional[str]:
        """
        Find nearest node to a coordinate
        
        Args:
            lat: Latitude
            lng: Longitude
            graph: Optional graph (will load if not provided)
        
        Returns:
            Node ID of nearest node
        """
        if graph is None:
            graph = self.build_graph()
        
        min_distance = float('inf')
        nearest_node = None
        
        for node_id in graph.nodes():
            node_data = graph.nodes[node_id]
            node_lat = node_data.get('lat', 0)
            node_lng = node_data.get('lng', 0)
            
            # Simple Euclidean distance (good enough for small areas)
            distance = ((lat - node_lat) ** 2 + (lng - node_lng) ** 2) ** 0.5
            
            if distance < min_distance:
                min_distance = distance
                nearest_node = node_id
        
        return nearest_node
    
    def get_node_coordinates(self, node_id: str, graph: nx.DiGraph = None) -> Tuple[float, float]:
        """
        Get coordinates for a node
        
        Args:
            node_id: Node ID
            graph: Optional graph
        
        Returns:
            (lat, lng) tuple
        """
        if graph is None:
            graph = self.build_graph()
        
        node_data = graph.nodes.get(node_id, {})
        return (node_data.get('lat', 0), node_data.get('lng', 0))
    
    def clear_cache(self):
        """Clear cached data"""
        self._node_cache = {}
        self._graph_cache = None
