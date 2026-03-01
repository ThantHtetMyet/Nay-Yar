import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/property.dart';

class MapView extends StatefulWidget {
  final List<Property> properties;
  final Function(Property) onPropertyTap;
  final String Function(String) getPropertyTypeName;
  final String Function(String) getListingTypeName;
  final String? selectedMrt;
  final Map<String, double>? mrtCoordinates;
  final Function()? onMrtMarkerTap;

  const MapView({
    super.key,
    required this.properties,
    required this.onPropertyTap,
    required this.getPropertyTypeName,
    required this.getListingTypeName,
    this.selectedMrt,
    this.mrtCoordinates,
    this.onMrtMarkerTap,
  });

  @override
  State<MapView> createState() => _MapViewState();
}

class _MapViewState extends State<MapView> {
  GoogleMapController? _controller;
  Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _createMarkers();
  }

  @override
  void didUpdateWidget(MapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.properties != widget.properties || 
        oldWidget.selectedMrt != widget.selectedMrt ||
        oldWidget.mrtCoordinates != widget.mrtCoordinates) {
      _createMarkers();
      _centerOnMrtIfAvailable();
    }
  }

  void _createMarkers() {
    _markers = {};
    
    // Add property markers
    _markers.addAll(widget.properties.map((property) {
      final lat = property.latitude;
      final lng = property.longitude;
      
      if (lat == null || lng == null) return null;
      
      final position = LatLng(lat, lng);
      
      return Marker(
        markerId: MarkerId('property_${property.id}'),
        position: position,
        infoWindow: InfoWindow(
          title: property.title,
          snippet: '${widget.getPropertyTypeName(property.propertyType)} • \$${property.price}',
          onTap: () => widget.onPropertyTap(property),
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          _getMarkerColor(property.propertyType),
        ),
      );
    }).whereType<Marker>());
    
    // Add MRT marker if available
    if (widget.selectedMrt != null && widget.mrtCoordinates != null) {
      final lat = widget.mrtCoordinates!['lat'];
      final lng = widget.mrtCoordinates!['lng'];
      
      if (lat != null && lng != null) {
        _markers.add(Marker(
          markerId: const MarkerId('mrt_station'),
          position: LatLng(lat, lng),
          infoWindow: InfoWindow(
            title: '🚇 ${widget.selectedMrt}',
            snippet: 'MRT Station',
            onTap: widget.onMrtMarkerTap,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet),
        ));
      }
    }
  }

  double _getMarkerColor(String propertyType) {
    switch (propertyType) {
      case 'PT001':
        return BitmapDescriptor.hueBlue;
      case 'PT002':
        return BitmapDescriptor.hueGreen;
      default:
        return BitmapDescriptor.hueRed;
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _controller = controller;
    _centerOnProperties();
  }

  void _centerOnMrtIfAvailable() {
    if (widget.selectedMrt != null && widget.mrtCoordinates != null && _controller != null) {
      final lat = widget.mrtCoordinates!['lat'];
      final lng = widget.mrtCoordinates!['lng'];
      
      if (lat != null && lng != null) {
        _controller!.animateCamera(
          CameraUpdate.newLatLngZoom(
            LatLng(lat, lng),
            15.0, // Zoom level matching web's flyTo behavior
          ),
        );
      }
    }
  }

  void _centerOnProperties() {
    if (widget.properties.isEmpty || _controller == null) return;

    final propertiesWithLocation = widget.properties
        .where((p) => p.latitude != null && p.longitude != null)
        .toList();

    if (propertiesWithLocation.isEmpty) return;

    double minLat = propertiesWithLocation.first.latitude!;
    double maxLat = propertiesWithLocation.first.latitude!;
    double minLng = propertiesWithLocation.first.longitude!;
    double maxLng = propertiesWithLocation.first.longitude!;

    for (final property in propertiesWithLocation) {
      minLat = property.latitude! < minLat ? property.latitude! : minLat;
      maxLat = property.latitude! > maxLat ? property.latitude! : maxLat;
      minLng = property.longitude! < minLng ? property.longitude! : minLng;
      maxLng = property.longitude! > maxLng ? property.longitude! : maxLng;
    }

    final latLngBounds = LatLngBounds(
      southwest: LatLng(minLat - 0.01, minLng - 0.01),
      northeast: LatLng(maxLat + 0.01, maxLng + 0.01),
    );

    _controller!.animateCamera(
      CameraUpdate.newLatLngBounds(latLngBounds, 50),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.properties.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.map_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No properties to display on map',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    final propertiesWithLocation = widget.properties
        .where((p) => p.latitude != null && p.longitude != null)
        .toList();

    if (propertiesWithLocation.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_off,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No properties with location data',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return GoogleMap(
      onMapCreated: _onMapCreated,
      initialCameraPosition: CameraPosition(
        target: propertiesWithLocation.isNotEmpty
            ? LatLng(
                propertiesWithLocation.first.latitude!,
                propertiesWithLocation.first.longitude!,
              )
            : const LatLng(1.3521, 103.8198), // Singapore center
        zoom: 12,
      ),
      markers: _markers,
      myLocationEnabled: true,
      myLocationButtonEnabled: true,
      zoomControlsEnabled: true,
      mapType: MapType.normal,
    );
  }
}