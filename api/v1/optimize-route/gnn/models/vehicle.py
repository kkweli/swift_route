"""
Vehicle profile models and constraints
"""
from dataclasses import dataclass, field
from typing import Optional, List, Dict
from enum import Enum


class VehicleType(str, Enum):
    """Vehicle type enumeration"""
    CAR = "car"
    TRUCK = "truck"
    VAN = "van"
    MOTORCYCLE = "motorcycle"
    BICYCLE = "bicycle"
    ELECTRIC_CAR = "electric_car"
    ELECTRIC_TRUCK = "electric_truck"


class FuelType(str, Enum):
    """Fuel type enumeration"""
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    HYBRID = "hybrid"
    CNG = "cng"  # Compressed Natural Gas


@dataclass
class VehicleProfile:
    """
    Vehicle characteristics and constraints
    Used for route filtering and optimization
    """
    # Basic info
    vehicle_type: VehicleType = VehicleType.CAR
    fuel_type: FuelType = FuelType.GASOLINE
    
    # Physical dimensions (meters)
    height_meters: Optional[float] = None
    width_meters: Optional[float] = None
    length_meters: Optional[float] = None
    weight_kg: Optional[float] = None
    
    # Performance
    max_speed_kmh: Optional[float] = None
    average_speed_kmh: float = 50.0
    
    # Fuel/Energy
    fuel_capacity_liters: Optional[float] = None
    battery_capacity_kwh: Optional[float] = None
    range_km: Optional[float] = None
    fuel_consumption_per_km: float = 0.08  # liters/km or kWh/km
    
    # Emissions
    emissions_factor_kg_per_km: float = 0.12  # kg CO2 per km
    
    # Road restrictions
    avoid_highways: bool = False
    avoid_tolls: bool = False
    avoid_ferries: bool = False
    avoid_unpaved: bool = False
    
    # Truck-specific
    hazmat: bool = False  # Carrying hazardous materials
    
    @classmethod
    def create_car(cls) -> 'VehicleProfile':
        """Create standard car profile"""
        return cls(
            vehicle_type=VehicleType.CAR,
            fuel_type=FuelType.GASOLINE,
            height_meters=1.5,
            width_meters=1.8,
            length_meters=4.5,
            weight_kg=1500,
            max_speed_kmh=180,
            average_speed_kmh=60,
            fuel_capacity_liters=50,
            range_km=600,
            fuel_consumption_per_km=0.08,
            emissions_factor_kg_per_km=0.12
        )
    
    @classmethod
    def create_truck(cls) -> 'VehicleProfile':
        """Create standard truck profile"""
        return cls(
            vehicle_type=VehicleType.TRUCK,
            fuel_type=FuelType.DIESEL,
            height_meters=4.0,
            width_meters=2.5,
            length_meters=12.0,
            weight_kg=18000,
            max_speed_kmh=90,
            average_speed_kmh=50,
            fuel_capacity_liters=300,
            range_km=1000,
            fuel_consumption_per_km=0.25,
            emissions_factor_kg_per_km=0.35
        )
    
    @classmethod
    def create_electric_car(cls) -> 'VehicleProfile':
        """Create electric car profile"""
        return cls(
            vehicle_type=VehicleType.ELECTRIC_CAR,
            fuel_type=FuelType.ELECTRIC,
            height_meters=1.5,
            width_meters=1.8,
            length_meters=4.5,
            weight_kg=1800,
            max_speed_kmh=150,
            average_speed_kmh=60,
            battery_capacity_kwh=60,
            range_km=300,
            fuel_consumption_per_km=0.15,  # kWh/km
            emissions_factor_kg_per_km=0.0  # Zero direct emissions
        )
    
    @classmethod
    def create_motorcycle(cls) -> 'VehicleProfile':
        """Create motorcycle profile"""
        return cls(
            vehicle_type=VehicleType.MOTORCYCLE,
            fuel_type=FuelType.GASOLINE,
            height_meters=1.2,
            width_meters=0.8,
            length_meters=2.0,
            weight_kg=200,
            max_speed_kmh=180,
            average_speed_kmh=50,
            fuel_capacity_liters=15,
            range_km=300,
            fuel_consumption_per_km=0.04,
            emissions_factor_kg_per_km=0.06
        )
    
    def requires_truck_route(self) -> bool:
        """Check if vehicle requires truck-specific routes"""
        return (
            self.vehicle_type in [VehicleType.TRUCK, VehicleType.ELECTRIC_TRUCK] or
            (self.weight_kg and self.weight_kg > 7500) or
            (self.height_meters and self.height_meters > 3.5) or
            (self.length_meters and self.length_meters > 10.0)
        )
    
    def is_electric(self) -> bool:
        """Check if vehicle is electric"""
        return self.fuel_type == FuelType.ELECTRIC
    
    def get_fuel_cost_per_km(self, fuel_price_per_unit: float = 1.5) -> float:
        """
        Calculate fuel cost per km
        
        Args:
            fuel_price_per_unit: Price per liter (gasoline/diesel) or per kWh (electric)
        
        Returns:
            Cost per km in currency units
        """
        return self.fuel_consumption_per_km * fuel_price_per_unit


@dataclass
class RoadRestrictions:
    """Road segment restrictions"""
    max_height_meters: Optional[float] = None
    max_width_meters: Optional[float] = None
    max_length_meters: Optional[float] = None
    max_weight_kg: Optional[float] = None
    no_trucks: bool = False
    no_hazmat: bool = False
    toll_road: bool = False
    unpaved: bool = False
    
    def allows_vehicle(self, vehicle: VehicleProfile) -> bool:
        """
        Check if road allows vehicle
        
        Args:
            vehicle: Vehicle profile
        
        Returns:
            True if vehicle can use this road
        """
        # Check truck restrictions
        if self.no_trucks and vehicle.requires_truck_route():
            return False
        
        # Check hazmat
        if self.no_hazmat and vehicle.hazmat:
            return False
        
        # Check height
        if self.max_height_meters and vehicle.height_meters:
            if vehicle.height_meters > self.max_height_meters:
                return False
        
        # Check width
        if self.max_width_meters and vehicle.width_meters:
            if vehicle.width_meters > self.max_width_meters:
                return False
        
        # Check length
        if self.max_length_meters and vehicle.length_meters:
            if vehicle.length_meters > self.max_length_meters:
                return False
        
        # Check weight
        if self.max_weight_kg and vehicle.weight_kg:
            if vehicle.weight_kg > self.max_weight_kg:
                return False
        
        # Check toll preference
        if self.toll_road and vehicle.avoid_tolls:
            return False
        
        # Check unpaved preference
        if self.unpaved and vehicle.avoid_unpaved:
            return False
        
        return True
