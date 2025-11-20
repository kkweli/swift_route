"""
OSRM Client for route optimization
Uses OpenStreetMap routing via OSRM demo server
"""
import requests
from typing import Dict, Any, Tuple, List, Optional
import time


class OSRMClient:
    """
    Client for OSRM (Open Source Routing Machine) API
    Uses free demo server by default
    """
    
    def __init__(
        self,
        base_url: str = "https://router.project-osrm.org",
        timeout: int = 10
    ):
        """
        Initialize OSRM client
        
        Args:
            base_url: OSRM server URL (default: public demo server)
            timeout: Request timeout in seconds
        """
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SwiftRoute/1.0'
        })
    
    def get_route(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        profile: str = "car",
        alternatives: bool = True,
        steps: bool = True,
        geometries: str = "geojson",
        continue_straight: bool = None
    ) -> Dict[str, Any]:
        """
        Get route from OSRM
        
        Args:
            origin: (lat, lng) tuple
            destination: (lat, lng) tuple
            profile: Routing profile (car, bike, foot)
            alternatives: Whether to return alternative routes
            steps: Whether to include turn-by-turn instructions
            geometries: Geometry format (geojson, polyline, polyline6)
            
        Returns:
            OSRM API response dictionary
            
        Raises:
            requests.exceptions.RequestException: If request fails
            
        Example:
            >>> client = OSRMClient()
            >>> route = client.get_route(
            ...     origin=(-1.2921, 36.8219),
            ...     destination=(-1.2864, 36.8172),
            ...     profile="car"
            ... )
        """
        # OSRM expects lng,lat order (not lat,lng)
        coords = f"{origin[1]},{origin[0]};{destination[1]},{destination[0]}"
        
        url = f"{self.base_url}/route/v1/{profile}/{coords}"
        
        params = {
            "alternatives": "3" if alternatives else "false",
            "steps": "true" if steps else "false",
            "geometries": geometries,
            "overview": "full",
            "annotations": "nodes,distance,duration,speed",
            "continue_straight": "default" if continue_straight is None else ("true" if continue_straight else "false")
        }
        
        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            raise OSRMTimeoutError(f"OSRM request timed out after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise OSRMError(f"OSRM request failed: {e}")
    
    def get_table(
        self,
        sources: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        profile: str = "car"
    ) -> Dict[str, Any]:
        """
        Get distance/duration matrix between multiple points
        
        Args:
            sources: List of (lat, lng) tuples
            destinations: List of (lat, lng) tuples
            profile: Routing profile
            
        Returns:
            Distance and duration matrices
        """
        # Convert to lng,lat and join
        all_coords = sources + destinations
        coords = ";".join([f"{lng},{lat}" for lat, lng in all_coords])
        
        url = f"{self.base_url}/table/v1/{profile}/{coords}"
        
        params = {
            "sources": ";".join(str(i) for i in range(len(sources))),
            "destinations": ";".join(str(i) for i in range(len(sources), len(all_coords)))
        }
        
        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise OSRMError(f"OSRM table request failed: {e}")
    
    def health_check(self) -> bool:
        """
        Check if OSRM server is accessible
        
        Returns:
            True if server is healthy, False otherwise
        """
        try:
            # Simple route request to check health
            # Use coordinates near equator for fast response
            self.get_route((0, 0), (0.01, 0.01))
            return True
        except Exception:
            return False


class OSRMError(Exception):
    """Base exception for OSRM errors"""
    pass


class OSRMTimeoutError(OSRMError):
    """OSRM request timeout"""
    pass


class OSRMUnavailableError(OSRMError):
    """OSRM service unavailable"""
    pass
