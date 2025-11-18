"""
Traffic and Context Analyzer
Analyzes time of day, area types, and traffic patterns for intelligent routing
"""
from datetime import datetime, time as dt_time
from typing import Dict, List, Tuple
import math


class TrafficAnalyzer:
    """
    Analyzes traffic patterns based on time of day and area type
    """
    
    # Traffic multipliers by hour (0-23) for typical urban areas
    HOURLY_TRAFFIC = {
        0: 0.3, 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.3, 5: 0.5,  # Night/Early morning
        6: 0.8, 7: 1.3, 8: 1.5, 9: 1.2, 10: 1.0, 11: 1.0,  # Morning rush
        12: 1.1, 13: 1.0, 14: 0.9, 15: 0.9, 16: 1.0, 17: 1.4,  # Midday/Afternoon
        18: 1.5, 19: 1.3, 20: 1.0, 21: 0.8, 22: 0.6, 23: 0.4  # Evening rush/Night
    }
    
    # Area type characteristics
    AREA_TYPES = {
        'residential': {
            'morning_peak': (7, 9),
            'evening_peak': (17, 19),
            'traffic_factor': 1.2,
            'speed_reduction': 0.85
        },
        'commercial': {
            'morning_peak': (8, 10),
            'evening_peak': (17, 20),
            'traffic_factor': 1.5,
            'speed_reduction': 0.70
        },
        'industrial': {
            'morning_peak': (6, 8),
            'evening_peak': (16, 18),
            'traffic_factor': 1.1,
            'speed_reduction': 0.90
        },
        'highway': {
            'morning_peak': (7, 9),
            'evening_peak': (17, 19),
            'traffic_factor': 1.3,
            'speed_reduction': 0.80
        }
    }
    
    @staticmethod
    def get_traffic_multiplier(hour: int, area_type: str = 'commercial') -> float:
        """
        Get traffic multiplier for given hour and area type
        
        Args:
            hour: Hour of day (0-23)
            area_type: Type of area (residential, commercial, industrial, highway)
        
        Returns:
            Traffic multiplier (1.0 = normal, >1.0 = congested, <1.0 = light)
        """
        base_multiplier = TrafficAnalyzer.HOURLY_TRAFFIC.get(hour, 1.0)
        
        area_config = TrafficAnalyzer.AREA_TYPES.get(area_type, TrafficAnalyzer.AREA_TYPES['commercial'])
        morning_start, morning_end = area_config['morning_peak']
        evening_start, evening_end = area_config['evening_peak']
        
        # Apply peak hour multiplier
        if morning_start <= hour <= morning_end or evening_start <= hour <= evening_end:
            base_multiplier *= area_config['traffic_factor']
        
        return round(base_multiplier, 2)
    
    @staticmethod
    def estimate_travel_time(
        distance_km: float,
        base_speed_kmh: float,
        hour: int,
        area_type: str = 'commercial'
    ) -> float:
        """
        Estimate travel time considering traffic
        
        Args:
            distance_km: Distance in kilometers
            base_speed_kmh: Base speed without traffic
            hour: Hour of day (0-23)
            area_type: Type of area
        
        Returns:
            Estimated time in minutes
        """
        traffic_multiplier = TrafficAnalyzer.get_traffic_multiplier(hour, area_type)
        
        # Reduce speed based on traffic
        effective_speed = base_speed_kmh / traffic_multiplier
        
        # Calculate time in minutes
        time_minutes = (distance_km / effective_speed) * 60
        
        return round(time_minutes, 1)
    
    @staticmethod
    def classify_area_type(coordinates: List[Tuple[float, float]]) -> str:
        """
        Classify area type based on route coordinates
        Simple heuristic - can be enhanced with actual map data
        
        Args:
            coordinates: List of (lat, lng) tuples
        
        Returns:
            Area type classification
        """
        if not coordinates or len(coordinates) < 2:
            return 'commercial'
        
        # Calculate route spread (simple heuristic)
        lats = [c[0] for c in coordinates]
        lngs = [c[1] for c in coordinates]
        
        lat_range = max(lats) - min(lats)
        lng_range = max(lngs) - min(lngs)
        
        # Large spread suggests highway/long distance
        if lat_range > 0.5 or lng_range > 0.5:
            return 'highway'
        
        # Medium spread suggests commercial
        if lat_range > 0.1 or lng_range > 0.1:
            return 'commercial'
        
        # Small spread suggests residential
        return 'residential'
    
    @staticmethod
    def should_avoid_route(hour: int, area_type: str) -> bool:
        """
        Determine if route should be avoided at given time
        
        Args:
            hour: Hour of day (0-23)
            area_type: Type of area
        
        Returns:
            True if route should be avoided due to heavy traffic
        """
        multiplier = TrafficAnalyzer.get_traffic_multiplier(hour, area_type)
        return multiplier > 1.4  # Avoid if traffic is 40%+ above normal
    
    @staticmethod
    def get_traffic_description(hour: int, area_type: str) -> str:
        """
        Get human-readable traffic description
        
        Args:
            hour: Hour of day (0-23)
            area_type: Type of area
        
        Returns:
            Traffic description string
        """
        multiplier = TrafficAnalyzer.get_traffic_multiplier(hour, area_type)
        
        if multiplier < 0.5:
            return "Very light traffic"
        elif multiplier < 0.8:
            return "Light traffic"
        elif multiplier < 1.2:
            return "Moderate traffic"
        elif multiplier < 1.5:
            return "Heavy traffic"
        else:
            return "Very heavy traffic - expect delays"


class AmenityRecommender:
    """
    Recommends amenities along route based on time of day and user needs
    """
    
    # Amenity types and their typical operating hours
    AMENITY_HOURS = {
        'restaurant': {'open': 6, 'close': 23, 'peak': (12, 14, 18, 21)},
        'cafe': {'open': 6, 'close': 22, 'peak': (7, 10, 15, 17)},
        'gas_station': {'open': 0, 'close': 24, 'peak': (7, 9, 17, 19)},
        'pharmacy': {'open': 8, 'close': 22, 'peak': (12, 14, 17, 19)},
        'atm': {'open': 0, 'close': 24, 'peak': (12, 14, 18, 20)},
        'hospital': {'open': 0, 'close': 24, 'peak': None},
        'police': {'open': 0, 'close': 24, 'peak': None},
        'parking': {'open': 0, 'close': 24, 'peak': (8, 10, 17, 19)},
        'restroom': {'open': 6, 'close': 22, 'peak': (12, 14, 18, 20)},
        'hotel': {'open': 0, 'close': 24, 'peak': (15, 17, 21, 23)},
        'supermarket': {'open': 7, 'close': 22, 'peak': (17, 19)},
        'bank': {'open': 9, 'close': 17, 'peak': (12, 14)}
    }
    
    @staticmethod
    def get_relevant_amenities(hour: int, route_duration_minutes: float) -> List[Dict]:
        """
        Get relevant amenities based on time of day and route duration
        
        Args:
            hour: Current hour (0-23)
            route_duration_minutes: Estimated route duration
        
        Returns:
            List of recommended amenity types with priorities
        """
        recommendations = []
        
        # Always useful
        recommendations.append({
            'type': 'gas_station',
            'priority': 'high',
            'reason': 'Fuel stops available along route'
        })
        
        # Time-based recommendations
        if 6 <= hour <= 10:
            recommendations.append({
                'type': 'cafe',
                'priority': 'high',
                'reason': 'Morning coffee stops'
            })
        
        if 11 <= hour <= 14:
            recommendations.append({
                'type': 'restaurant',
                'priority': 'high',
                'reason': 'Lunch options available'
            })
        
        if 17 <= hour <= 21:
            recommendations.append({
                'type': 'restaurant',
                'priority': 'high',
                'reason': 'Dinner options available'
            })
        
        # Long route recommendations
        if route_duration_minutes > 60:
            recommendations.append({
                'type': 'restroom',
                'priority': 'medium',
                'reason': 'Rest stops for long journey'
            })
            recommendations.append({
                'type': 'parking',
                'priority': 'medium',
                'reason': 'Parking areas for breaks'
            })
        
        if route_duration_minutes > 180:
            recommendations.append({
                'type': 'hotel',
                'priority': 'medium',
                'reason': 'Accommodation options for extended travel'
            })
        
        # Emergency services (always low priority unless needed)
        recommendations.append({
            'type': 'hospital',
            'priority': 'low',
            'reason': 'Emergency medical facilities'
        })
        
        recommendations.append({
            'type': 'pharmacy',
            'priority': 'low',
            'reason': 'Pharmacy services available'
        })
        
        # Financial services
        if 9 <= hour <= 17:
            recommendations.append({
                'type': 'bank',
                'priority': 'low',
                'reason': 'Banking services available'
            })
        
        recommendations.append({
            'type': 'atm',
            'priority': 'low',
            'reason': 'ATM access along route'
        })
        
        return recommendations
    
    @staticmethod
    def is_amenity_open(amenity_type: str, hour: int) -> bool:
        """
        Check if amenity type is typically open at given hour
        
        Args:
            amenity_type: Type of amenity
            hour: Hour of day (0-23)
        
        Returns:
            True if typically open
        """
        hours = AmenityRecommender.AMENITY_HOURS.get(amenity_type)
        if not hours:
            return True  # Unknown amenity, assume open
        
        open_hour = hours['open']
        close_hour = hours['close']
        
        # 24-hour amenities
        if open_hour == 0 and close_hour == 24:
            return True
        
        # Normal hours
        return open_hour <= hour < close_hour
    
    @staticmethod
    def format_amenity_message(amenities: List[Dict]) -> str:
        """
        Format amenity recommendations into user-friendly message
        
        Args:
            amenities: List of amenity recommendations
        
        Returns:
            Formatted message string
        """
        if not amenities:
            return "No specific amenity recommendations for this route."
        
        high_priority = [a for a in amenities if a['priority'] == 'high']
        
        if high_priority:
            messages = [a['reason'] for a in high_priority]
            return " • ".join(messages)
        
        return "Standard amenities available along route"
