import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/property.dart';
import '../components/property_card.dart';
import '../components/search_bar.dart';
import '../components/map_view.dart';
import '../components/mrt_search_dropdown.dart';
import '../utils/map_utils.dart';

class DefaultPage extends StatefulWidget {
  const DefaultPage({super.key});

  @override
  State<DefaultPage> createState() => _DefaultPageState();
}

class _DefaultPageState extends State<DefaultPage> {
  List<Property> _properties = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedPropertyType = 'All';
  String _selectedListingType = 'All';
  bool _showMap = false;
  String _selectedMrt = 'Select MRT Station';
  bool _isMrtDropdownOpen = false;
  String _mrtSearchQuery = '';
  List<Property> _nearbyProperties = [];
  bool _isSearchingMrt = false;
  Map<String, double>? _mrtCoordinates;

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    try {
      final properties = await ApiService.getAllListings();
      setState(() {
        _properties = properties;
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading properties: $error')),
        );
      }
    }
  }

  List<Property> get _filteredProperties {
    // If MRT search is active, use nearby properties
    if (_selectedMrt != 'Select MRT Station' && _nearbyProperties.isNotEmpty) {
      return _nearbyProperties.where((property) {
        final matchesSearch = _searchQuery.isEmpty ||
            property.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            property.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            property.address.toLowerCase().contains(_searchQuery.toLowerCase());

        final matchesPropertyType = _selectedPropertyType == 'All' ||
            property.propertyType == _getPropertyTypeId(_selectedPropertyType);

        final matchesListingType = _selectedListingType == 'All' ||
            property.listingType == _getListingTypeId(_selectedListingType);

        return matchesSearch && matchesPropertyType && matchesListingType;
      }).toList();
    }

    // Otherwise, use all properties
    return _properties.where((property) {
      final matchesSearch = _searchQuery.isEmpty ||
          property.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          property.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          property.address.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesPropertyType = _selectedPropertyType == 'All' ||
          property.propertyType == _getPropertyTypeId(_selectedPropertyType);

      final matchesListingType = _selectedListingType == 'All' ||
          property.listingType == _getListingTypeId(_selectedListingType);

      return matchesSearch && matchesPropertyType && matchesListingType;
    }).toList();
  }

  String _getPropertyTypeId(String name) {
    switch (name) {
      case 'HDB':
        return 'PT001';
      case 'Condo':
        return 'PT002';
      default:
        return '';
    }
  }

  String _getListingTypeId(String name) {
    switch (name) {
      case 'Rent':
        return 'LT001';
      case 'Sale':
        return 'LT002';
      default:
        return '';
    }
  }

  String _getPropertyTypeName(String id) {
    switch (id) {
      case 'PT001':
        return 'HDB';
      case 'PT002':
        return 'Condo';
      default:
        return 'Unknown';
    }
  }

  String _getListingTypeName(String id) {
    switch (id) {
      case 'LT001':
        return 'Rent';
      case 'LT002':
        return 'Sale';
      default:
        return 'Unknown';
    }
  }

  void _handleSearch(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  void _handlePropertyTypeChange(String? value) {
    setState(() {
      _selectedPropertyType = value ?? 'All';
    });
  }

  void _handleListingTypeChange(String? value) {
    setState(() {
      _selectedListingType = value ?? 'All';
    });
  }

  void _toggleMapView() {
    setState(() {
      _showMap = !_showMap;
    });
  }

  void _handlePropertyTap(Property property) {
    context.go('/property/${property.id}');
  }

  void _handleCreateProperty() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isLoggedIn) {
      context.go('/signin');
      return;
    }
    // TODO: Implement create property modal
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Create property feature coming soon!')),
    );
  }

  void _handleLogout() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.logout();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Logged out successfully')),
    );
  }

  void _handleMrtSearch() async {
    if (_selectedMrt == 'Select MRT Station') return;
    
    setState(() {
      _isSearchingMrt = true;
    });

    try {
      // Get MRT station coordinates using geocoding
      final mrtCoords = await ApiService.fetchGeocode(_selectedMrt);
      if (mrtCoords == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Unable to get MRT station coordinates')),
          );
        }
        setState(() {
          _mrtCoordinates = null;
        });
        return;
      }
      
      // Store MRT coordinates for map display
      setState(() {
        _mrtCoordinates = mrtCoords;
      });

      // Filter properties within 2km radius using haversine distance
      const radiusKm = 2.0;
      final nearbyProperties = _properties.where((property) {
        final lat = mrtCoords['lat'];
        final lng = mrtCoords['lng'];
        if (lat == null || lng == null) return false;
        if (property.latitude == null || property.longitude == null) return false;
        
        final distance = haversine(
          lat,
          lng,
          property.latitude!,
          property.longitude!,
        );
        return distance <= radiusKm;
      }).toList();

      setState(() {
        _nearbyProperties = nearbyProperties;
        _isMrtDropdownOpen = false;
        _mrtSearchQuery = '';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Found ${nearbyProperties.length} properties within 2km of $_selectedMrt')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error searching MRT area: $error')),
        );
      }
    } finally {
      setState(() {
        _isSearchingMrt = false;
      });
    }
  }

  void _clearMrtSearch() {
    setState(() {
      _selectedMrt = 'Select MRT Station';
      _mrtSearchQuery = '';
      _nearbyProperties = [];
      _isMrtDropdownOpen = false;
      _mrtCoordinates = null;
    });
  }

  void _handleMrtSelection(String mrt) {
    setState(() {
      _selectedMrt = mrt;
    });
  }

  void _handleMrtSearchQuery(String query) {
    setState(() {
      _mrtSearchQuery = query;
    });
  }

  void _toggleMrtDropdown() {
    setState(() {
      _isMrtDropdownOpen = !_isMrtDropdownOpen;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nay Yar Property'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_showMap ? Icons.list : Icons.map),
            onPressed: _toggleMapView,
            tooltip: _showMap ? 'Show List' : 'Show Map',
          ),
          if (authProvider.isLoggedIn) ...[
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: _handleCreateProperty,
              tooltip: 'Create Property',
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: _handleLogout,
              tooltip: 'Logout',
            ),
          ] else ...[
            TextButton(
              onPressed: () => context.go('/signin'),
              child: const Text(
                'Sign In',
                style: TextStyle(color: Colors.white),
              ),
            ),
            TextButton(
              onPressed: () => context.go('/signup'),
              child: const Text(
                'Sign Up',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Column(
              children: [
                CustomSearchBar(
                  onSearch: _handleSearch,
                  hintText: 'Search by location, property name...',
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _selectedPropertyType,
                        decoration: const InputDecoration(
                          labelText: 'Property Type',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: ['All', 'HDB', 'Condo']
                            .map((type) => DropdownMenuItem(
                                  value: type,
                                  child: Text(type),
                                ))
                            .toList(),
                        onChanged: _handlePropertyTypeChange,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _selectedListingType,
                        decoration: const InputDecoration(
                          labelText: 'Listing Type',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: ['All', 'Rent', 'Sale']
                            .map((type) => DropdownMenuItem(
                                  value: type,
                                  child: Text(type),
                                ))
                            .toList(),
                        onChanged: _handleListingTypeChange,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // MRT Search Dropdown
                MRTSearchDropdown(
                  selectedMrt: _selectedMrt,
                  onMrtSelected: _handleMrtSelection,
                  onSearchPressed: _handleMrtSearch,
                  onClearPressed: _clearMrtSearch,
                  isSearching: _isSearchingMrt,
                  searchQuery: _mrtSearchQuery,
                  onSearchQueryChanged: _handleMrtSearchQuery,
                  isOpen: _isMrtDropdownOpen,
                  onToggle: _toggleMrtDropdown,
                ),
              ],
            ),
          ),
          // Main Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _showMap
                    ? MapView(
                        properties: _filteredProperties,
                        onPropertyTap: _handlePropertyTap,
                        getPropertyTypeName: _getPropertyTypeName,
                        getListingTypeName: _getListingTypeName,
                        selectedMrt: _selectedMrt != 'Select MRT Station' ? _selectedMrt : null,
                        mrtCoordinates: _mrtCoordinates,
                        onMrtMarkerTap: () {
                          // Handle MRT marker tap - could show more info or clear selection
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Selected MRT: $_selectedMrt')),
                          );
                        },
                      )
                    : _filteredProperties.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.search_off,
                                  size: 64,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No properties found',
                                  style: TextStyle(
                                    fontSize: 18,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Try adjusting your search criteria',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredProperties.length,
                            itemBuilder: (context, index) {
                              final property = _filteredProperties[index];
                              return PropertyCard(
                                property: property,
                                onTap: () => _handlePropertyTap(property),
                                getPropertyTypeName: _getPropertyTypeName,
                                getListingTypeName: _getListingTypeName,
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}