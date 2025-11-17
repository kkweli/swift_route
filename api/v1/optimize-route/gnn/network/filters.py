"""
Vehicle-specific network filtering
Filters road networks based on vehicle constraints
"""
import networkx as nx
from typing import Dict, Set
from ..models.vehicle import VehicleProfile, RoadRestrictions


class VehicleNetworkFilter:
    """Filters road networks for vehicle compatibility"""
    
    # Road type accessibility by vehicle type
    ROAD_TYPE_ACCESS = {
        'car': {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service'},
        'truck': {'motorway', 'trunk', 'primary', 'secondary', 'tertiary'},  # Avoid residential
        'van': {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential'},
        'motorcycle': {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service'},
        'bicycle': {'cycleway', 'path', 'residential', 'service', 'tertiary'},
        'electric_car': {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service'},
        'electric_truck': {'motorway', 'trunk', 'primary', 'secondary', 'tertiary'}
    }
    
    @staticmethod
    def filter_graph_by_vehicle(
        graph: nx.DiGraph,
        vehicle: VehicleProfile
    ) -> nx.DiGraph:
        """
        Filter graph to only include edges accessible by vehicle
        
        Args:
            graph: Original road network graph
            vehicle: Vehicle profile with constraints
        
        Returns:
            Filtered graph
        """
        # Create a copy to avoid modifying original
        filtered_graph = graph.copy()
        
        # Get allowed road types for this vehicle
        allowed_road_types = VehicleNetworkFilter.ROAD_TYPE_ACCESS.get(
            vehicle.vehicle_type.value,
            {'primary', 'secondary', 'tertiary', 'residential'}
        )
        
        # Collect edges to remove
        edges_to_remove = []
        
        for u, v, data in filtered_graph.edges(data=True):
            should_remove = False
            
            # Check road type
            road_type = data.get('road_type', 'unknown').lower()
            if road_type not in allowed_road_types:
                should_remove = True
            
            # Check highway avoidance
            if vehicle.avoid_highways and road_type in {'motorway', 'trunk'}:
                should_remove = True
            
            # Parse restrictions from tags if available
            tags = data.get('tags', {})
            restrictions = VehicleNetworkFilter._parse_restrictions(tags, data)
            
            # Check if vehicle is allowed on this road
            if not restrictions.allows_vehicle(vehicle):
                should_remove = True
            
            if should_remove:
                edges_to_remove.append((u, v))
        
        # Remove filtered edges
        filtered_graph.remove_edges_from(edges_to_remove)
        
        # Remove isolated nodes (nodes with no edges)
        isolated_nodes = list(nx.isolates(filtered_graph))
        filtered_graph.remove_nodes_from(isolated_nodes)
        
        return filtered_graph
    
    @staticmethod
    def _parse_restrictions(tags: Dict, edge_data: Dict) -> RoadRestrictions:
        """
        Parse road restrictions from OSM tags
        
        Args:
            tags: OSM tags dictionary
            edge_data: Edge data dictionary
        
        Returns:
            RoadRestrictions object
        """
        restrictions = RoadRestrictions()
        
        # Parse height restriction
        if 'maxheight' in tags:
            try:
                restrictions.max_height_meters = float(tags['maxheight'])
            except (ValueError, TypeError):
                pass
        
        # Parse width restriction
        if 'maxwidth' in tags:
            try:
                restrictions.max_width_meters = float(tags['maxwidth'])
            except (ValueError, TypeError):
                pass
        
        # Parse length restriction
        if 'maxlength' in tags:
            try:
                restrictions.max_length_meters = float(tags['maxlength'])
            except (ValueError, TypeError):
                pass
        
        # Parse weight restriction
        if 'maxweight' in tags:
            try:
                # Convert tons to kg
                restrictions.max_weight_kg = float(tags['maxweight']) * 1000
            except (ValueError, TypeError):
                pass
        
        # Check for truck restrictions
        if tags.get('hgv') == 'no' or tags.get('goods') == 'no':
            restrictions.no_trucks = True
        
        # Check for hazmat restrictions
        if tags.get('hazmat') == 'no':
            restrictions.no_hazmat = True
        
        # Check for toll roads
        if tags.get('toll') == 'yes' or edge_data.get('toll', False):
            restrictions.toll_road = True
        
        # Check surface type
        surface = tags.get('surface', '').lower()
        if surface in {'unpaved', 'gravel', 'dirt', 'sand', 'grass'}:
            restrictions.unpaved = True
        
        return restrictions
    
    @staticmethod
    def prioritize_truck_routes(
        graph: nx.DiGraph,
        vehicle: VehicleProfile
    ) -> nx.DiGraph:
        """
        Adjust edge weights to prioritize truck-friendly routes
        
        Args:
            graph: Road network graph
            vehicle: Vehicle profile
        
        Returns:
            Graph with adjusted weights
        """
        if not vehicle.requires_truck_route():
            return graph
        
        # Truck-friendly road types (lower penalty)
        truck_friendly = {'motorway', 'trunk', 'primary'}
        
        for u, v, data in graph.edges(data=True):
            road_type = data.get('road_type', 'unknown').lower()
            current_weight = data.get('weight', 1.0)
            
            if road_type in truck_friendly:
                # Reduce weight for truck-friendly roads
                data['weight'] = current_weight * 0.9
            else:
                # Increase weight for less suitable roads
                data['weight'] = current_weight * 1.3
        
        return graph
    
    @staticmethod
    def get_accessible_nodes(
        graph: nx.DiGraph,
        vehicle: VehicleProfile
    ) -> Set[str]:
        """
        Get set of nodes accessible by vehicle
        
        Args:
            graph: Road network graph
            vehicle: Vehicle profile
        
        Returns:
            Set of accessible node IDs
        """
        filtered_graph = VehicleNetworkFilter.filter_graph_by_vehicle(graph, vehicle)
        return set(filtered_graph.nodes())
    
    @staticmethod
    def validate_route_for_vehicle(
        graph: nx.DiGraph,
        path: list,
        vehicle: VehicleProfile
    ) -> tuple[bool, str]:
        """
        Validate if a route is suitable for a vehicle
        
        Args:
            graph: Road network graph
            path: List of node IDs
            vehicle: Vehicle profile
        
        Returns:
            (is_valid, reason) tuple
        """
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            
            if not graph.has_edge(u, v):
                return False, f"No edge between {u} and {v}"
            
            edge_data = graph[u][v]
            tags = edge_data.get('tags', {})
            restrictions = VehicleNetworkFilter._parse_restrictions(tags, edge_data)
            
            if not restrictions.allows_vehicle(vehicle):
                road_name = edge_data.get('name', 'Unknown road')
                return False, f"Vehicle restricted on {road_name}"
        
        return True, "Route is valid for vehicle"
