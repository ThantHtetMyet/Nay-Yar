import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../models/lookup.dart';

class CreatePropertyPage extends StatefulWidget {
  const CreatePropertyPage({super.key});

  @override
  State<CreatePropertyPage> createState() => _CreatePropertyPageState();
}

class _CreatePropertyPageState extends State<CreatePropertyPage> {
  final List<String> _tabs = ['Classification', 'Pricing', 'Address', 'Physical Details', 'Logistics & Contact', 'Review'];
  int _currentTab = 0;
  int _classStep = 1; // 1 = property type, 2 = rental mode
  
  // Form data
  final _formData = {
    'ListingType': 'LT001',
    'PropertyType': '',
    'Currency': 'SGD',
    'Price': '',
    'RentTerm': 'Per Month',
    'Country': 'Singapore',
    'City': '',
    'Address': '',
    'PostalCode': '',
    'Bedrooms': '',
    'Bathrooms': '',
    'AreaSize': '',
    'AvailableFrom': '',
    'ContactPhone': '',
    'ContactEmail': '',
    'GenderPreference': 'Any',
    'Description': '',
    'Remark': '',
  };

  // Dropdown data
  List<PropertyType> _propertyTypes = [];
  List<PropertySubType> _propertySubTypes = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  // Rental mode
  String _rentalMode = ''; // '' | 'whole' | 'rooms'
  
  // Room counts: { [SubTypeID]: qty }
  final Map<String, int> _roomCounts = {};

  // Room units (Pricing tab)
  final List<Map<String, dynamic>> _roomUnits = [];

  // Error handling
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchLookups();
  }

  Future<void> _fetchLookups() async {
    try {
      final lookups = await ApiService.getAllLookups();
      setState(() {
        _propertyTypes = (lookups['ptData'] ?? []).map((item) => PropertyType.fromJson(item)).toList();
        _propertySubTypes = (lookups['pstData'] ?? []).map((item) => PropertySubType.fromJson(item)).toList();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _errorMessage = 'Failed to load property configurations: $error';
        _isLoading = false;
      });
    }
  }

  void _changeRoomCount(String typeID, int delta) {
    setState(() {
      _roomCounts[typeID] = (_roomCounts[typeID] ?? 0) + delta;
      if (_roomCounts[typeID]! < 0) _roomCounts[typeID] = 0;
    });
  }

  Map<String, dynamic> _newUnit(String subTypeID, String label) {
    return {
      'SubTypeID': subTypeID,
      'Label': label,
      'Price': '',
      'PubIncluded': false,
      'RentalBasis': 'Whole',
      'TotalBeds': 2,
      'BedsForRent': 1,
      'GenderPref': 'Any',
      'RegistrationProvided': false,
      'Remark': '',
    };
  }

  void _buildRoomUnits() {
    const wholeUnitId = 'RST001';
    setState(() {
      if (_rentalMode == 'whole') {
        final wholeName = _propertySubTypes
            .firstWhere((p) => p.id == wholeUnitId, orElse: () => PropertySubType(id: wholeUnitId, name: 'Whole Unit', description: '', propertyTypeId: ''))
            .name;
        _roomUnits.clear();
        _roomUnits.add(_newUnit(wholeUnitId, wholeName));
      } else {
        final expanded = <Map<String, dynamic>>[];
        final roomSubTypes = _propertySubTypes.where((pst) => pst.id != wholeUnitId).toList();
        
        for (final pst in roomSubTypes) {
          final qty = _roomCounts[pst.id] ?? 0;
          for (int i = 0; i < qty; i++) {
            expanded.add(_newUnit(pst.id, qty > 1 ? '${pst.name} #${i + 1}' : pst.name));
          }
        }
        _roomUnits.clear();
        _roomUnits.addAll(expanded);
      }
    });
  }

  void _goNext() {
    // Internal sub-step within Classification
    if (_currentTab == 0 && _classStep == 1) {
      setState(() {
        _classStep = 2;
      });
      return;
    }
    
    if (_currentTab == 0 && _classStep == 2) {
      _buildRoomUnits();
    }

    // Validate Postal Code when leaving the Address tab
    if (_tabs[_currentTab] == 'Address' && _formData['PostalCode']!.isNotEmpty) {
      if (_formData['Country']!.toLowerCase() == 'singapore' && 
          !RegExp(r'^\d{6}$').hasMatch(_formData['PostalCode']!)) {
        setState(() {
          _errorMessage = 'Please enter a valid 6-digit Singapore postal code.';
        });
        return;
      }
    }

    int next = _currentTab + 1;
    if (_skipPhysical && _tabs[next] == 'Physical Details') next++;
    
    setState(() {
      _currentTab = next.clamp(0, _tabs.length - 1);
    });
  }

  void _goPrev() {
    if (_currentTab == 0 && _classStep == 2) {
      setState(() {
        _classStep = 1;
      });
      return;
    }
    
    int prev = _currentTab - 1;
    if (_skipPhysical && _tabs[prev] == 'Physical Details') prev--;
    
    setState(() {
      _currentTab = prev.clamp(0, _tabs.length - 1);
    });
  }

  bool get _skipPhysical => _rentalMode == 'rooms';
  
  bool get _isLastTab => _currentTab == _tabs.length - 1;

  int get _totalRooms {
    return _roomCounts.values.fold(0, (sum, count) => sum + count);
  }

  bool get _isTabValid {
    if (_currentTab == 0) {
      if (_classStep == 1) return _formData['PropertyType']!.isNotEmpty;
      if (_rentalMode.isEmpty) return false;
      if (_rentalMode == 'rooms') return _totalRooms > 0;
      return true;
    }
    
    switch (_tabs[_currentTab]) {
      case 'Pricing':
        // Currency must be selected, room units must exist, and all units must have valid prices
        if (_formData['Currency']!.isEmpty) return false;
        if (_roomUnits.isEmpty) return false;
        
        // Validate all room units have valid prices
        for (final unit in _roomUnits) {
          final priceStr = unit['Price'].toString();
          if (priceStr.isEmpty) return false;
          final price = double.tryParse(priceStr);
          if (price == null || price <= 0) return false;
        }
        return true;
        
      case 'Address':
        return _formData['Country']!.isNotEmpty && _formData['City']!.isNotEmpty;
        
      case 'Physical Details':
        return _formData['Bedrooms']!.isNotEmpty && 
               int.tryParse(_formData['Bedrooms']!) != null &&
               int.parse(_formData['Bedrooms']!) >= 0;
               
      case 'Logistics & Contact':
        // Contact phone and available from date are required
        if (_formData['ContactPhone']!.isEmpty) return false;
        if (_formData['AvailableFrom']!.isEmpty) return false;
        
        // Validate date format and ensure it's not in the past
        try {
          final availableDate = DateTime.parse(_formData['AvailableFrom']!);
          final today = DateTime.now();
          final todayDate = DateTime(today.year, today.month, today.day);
          if (availableDate.isBefore(todayDate)) return false;
        } catch (e) {
          return false;
        }
        
        // Validate phone format (basic validation for Singapore numbers)
        final phone = _formData['ContactPhone']!.trim();
        if (phone.isEmpty) return false;
        
        // Basic phone validation - can be enhanced
        final phoneRegex = RegExp(r'^\+?\d{8,15}$');
        if (!phoneRegex.hasMatch(phone.replaceAll(RegExp(r'[\s\-]'), ''))) {
          return false;
        }
        
        return true;
        
      case 'Review':
        return true;
        
      default:
        return true;
    }
  }

  Future<void> _handleSubmit() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    
    if (user == null) {
      setState(() {
        _errorMessage = 'You must be logged in to create a property listing.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final payload = {
        ..._formData,
        'CreatedBy': user.id,
        'PropertySubType': jsonEncode(_roomUnits),
        'Price': _rentalMode == 'whole' ? (_roomUnits.isNotEmpty ? _roomUnits[0]['Price'] : '0') : '0',
      };

      final data = await ApiService.createListing(payload);
      
      if (data['success']) {
        if (mounted) {
          Navigator.of(context).pop(data['data']['PropertyID']);
        }
      } else {
        setState(() {
          _errorMessage = data['error'] ?? 'An unknown error occurred.';
        });
      }
    } catch (error) {
      setState(() {
        _errorMessage = 'Failed to create listing. Please check your connection and try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String _getPTName(String id) {
    return _propertyTypes.firstWhere((p) => p.id == id, orElse: () => PropertyType(id: id, name: id, description: '')).name;
  }

  // Validation error messages for specific fields
  String? _getFieldError(String fieldName) {
    switch (fieldName) {
      case 'PropertyType':
        if (_currentTab == 0 && _classStep == 1 && _formData['PropertyType']!.isEmpty) {
          return 'Please select a property type';
        }
        return null;
        
      case 'Currency':
        if (_currentTab == 1 && _formData['Currency']!.isEmpty) {
          return 'Please select a currency';
        }
        return null;
        
      case 'Country':
        if (_currentTab == 2 && _formData['Country']!.isEmpty) {
          return 'Country is required';
        }
        return null;
        
      case 'City':
        if (_currentTab == 2 && _formData['City']!.isEmpty) {
          return 'City is required';
        }
        return null;
        
      case 'Bedrooms':
        if (_currentTab == 3 && _formData['Bedrooms']!.isEmpty) {
          return 'Number of bedrooms is required';
        }
        if (_currentTab == 3 && int.tryParse(_formData['Bedrooms']!) == null) {
          return 'Please enter a valid number';
        }
        return null;
        
      case 'Bathrooms':
        if (_currentTab == 3 && _formData['Bathrooms']!.isNotEmpty) {
          if (int.tryParse(_formData['Bathrooms']!) == null) {
            return 'Please enter a valid number';
          }
          if (int.parse(_formData['Bathrooms']!) < 0) {
            return 'Number cannot be negative';
          }
        }
        return null;
        
      case 'AreaSize':
        if (_currentTab == 3 && _formData['AreaSize']!.isNotEmpty) {
          if (double.tryParse(_formData['AreaSize']!) == null) {
            return 'Please enter a valid number';
          }
          if (double.parse(_formData['AreaSize']!) <= 0) {
            return 'Area must be positive';
          }
        }
        return null;
        
      case 'AvailableFrom':
        if (_currentTab == 4 && _formData['AvailableFrom']!.isEmpty) {
          return 'Available from date is required';
        }
        if (_currentTab == 4 && _formData['AvailableFrom']!.isNotEmpty) {
          try {
            final availableDate = DateTime.parse(_formData['AvailableFrom']!);
            final today = DateTime.now();
            final todayDate = DateTime(today.year, today.month, today.day);
            if (availableDate.isBefore(todayDate)) {
              return 'Date cannot be in the past';
            }
          } catch (e) {
            return 'Please enter a valid date';
          }
        }
        return null;
        
      case 'ContactPhone':
        if (_currentTab == 4 && _formData['ContactPhone']!.isEmpty) {
          return 'Contact phone is required';
        }
        if (_currentTab == 4 && _formData['ContactPhone']!.isNotEmpty) {
          final phone = _formData['ContactPhone']!.trim();
          final phoneRegex = RegExp(r'^\+?\d{8,15}$');
          if (!phoneRegex.hasMatch(phone.replaceAll(RegExp(r'[\s\-]'), ''))) {
            return 'Please enter a valid phone number';
          }
        }
        return null;
        
      case 'PostalCode':
        if (_currentTab == 2 && _formData['PostalCode']!.isNotEmpty) {
          if (_formData['Country']!.toLowerCase() == 'singapore' && 
              !RegExp(r'^\d{6}$').hasMatch(_formData['PostalCode']!)) {
            return 'Please enter a valid 6-digit Singapore postal code';
          }
        }
        return null;
        
      default:
        return null;
    }
  }

  // Get validation errors for room units in pricing tab
  List<String> _getRoomUnitErrors() {
    final errors = <String>[];
    
    if (_currentTab == 1) {
      if (_roomUnits.isEmpty) {
        errors.add('At least one room unit is required');
      } else {
        for (int i = 0; i < _roomUnits.length; i++) {
          final unit = _roomUnits[i];
          final priceStr = unit['Price'].toString();
          
          if (priceStr.isEmpty) {
            errors.add('${unit['Label']}: Price is required');
          } else {
            final price = double.tryParse(priceStr);
            if (price == null || price <= 0) {
              errors.add('${unit['Label']}: Please enter a valid positive price');
            }
          }
        }
      }
    }
    
    return errors;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Create Property')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Property'),
        actions: [
          if (_currentTab > 0)
            TextButton(
              onPressed: () => setState(() {
                _currentTab = 0;
                _classStep = 1;
              }),
              child: const Text('Start Over', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: Column(
        children: [
          // Progress indicator
          LinearProgressIndicator(
            value: (_currentTab + 1) / _tabs.length,
            backgroundColor: Colors.grey[300],
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue),
          ),
          
          // Tab indicator
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  '${_currentTab + 1} of ${_tabs.length}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    _tabs[_currentTab],
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ],
            ),
          ),
          
          // Error message
          if (_errorMessage != null)
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.red[50],
              child: Row(
                children: [
                  Icon(Icons.error, color: Colors.red[700]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.red[700]),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(() {
                      _errorMessage = null;
                    }),
                  ),
                ],
              ),
            ),
          
          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _renderCurrentTab(),
            ),
          ),
          
          // Navigation buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withValues(alpha: 0.2),
                  spreadRadius: 1,
                  blurRadius: 5,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: Row(
              children: [
                if (_currentTab > 0 || _classStep > 1)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _goPrev,
                      child: const Text('Previous'),
                    ),
                  )
                else
                  const Spacer(),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isTabValid ? (_isLastTab ? _handleSubmit : _goNext) : null,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_isLastTab ? 'Submit' : 'Next'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _renderCurrentTab() {
    switch (_tabs[_currentTab]) {
      case 'Classification':
        return _renderClassification();
      case 'Pricing':
        return _renderPricing();
      case 'Address':
        return _renderAddress();
      case 'Physical Details':
        return _renderPhysicalDetails();
      case 'Logistics & Contact':
        return _renderLogisticsContact();
      case 'Review':
        return _renderReview();
      default:
        return const SizedBox();
    }
  }

  Widget _renderClassification() {
    // Sub-step 1: Property Type
    if (_classStep == 1) {
      final propertyTypeError = _getFieldError('PropertyType');
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What type of property are you listing?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 24),
          
          // Validation message for property type selection
          if (propertyTypeError != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.red[50],
                border: Border.all(color: Colors.red[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                  const SizedBox(width: 8),
                  Text(
                    propertyTypeError,
                    style: TextStyle(
                      color: Colors.red[800],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: _propertyTypes.length,
            itemBuilder: (context, index) {
              final propertyType = _propertyTypes[index];
              final isSelected = _formData['PropertyType'] == propertyType.id;
              
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _formData['PropertyType'] = propertyType.id;
                    _rentalMode = '';
                    _roomCounts.clear();
                    Future.delayed(const Duration(milliseconds: 180), () {
                      setState(() {
                        _classStep = 2;
                      });
                    });
                  });
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.blue[50] : Colors.white,
                    border: Border.all(
                      color: isSelected ? Colors.blue : Colors.grey[300]!,
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: Colors.blue.withValues(alpha: 0.2),
                              spreadRadius: 1,
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        propertyType.id == 'PT001' ? '🏘️' : '🏙️',
                        style: const TextStyle(fontSize: 48),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        propertyType.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? Colors.blue[700] : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      );
    }

    // Sub-step 2: Rental Mode
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Text(
                _formData['PropertyType'] == 'PT001' ? '🏘️' : '🏙️',
                style: const TextStyle(fontSize: 24),
              ),
              const SizedBox(width: 12),
              Text(
                _getPTName(_formData['PropertyType']!),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'How would you like to rent this property?',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 24),
        
        // Validation message for rental mode selection
        if (_rentalMode.isEmpty && _currentTab == 0 && _classStep == 2) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                const SizedBox(width: 8),
                Text(
                  'Please select a rental mode',
                  style: TextStyle(
                    color: Colors.red[800],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
        
        GridView(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.1,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          children: [
            _buildRentalModeCard(
              '🏠',
              'Whole Unit',
              'Rent out the entire unit at one price',
              'whole',
            ),
            _buildRentalModeCard(
              '🛏️',
              'By Room',
              'List individual rooms with separate prices',
              'rooms',
            ),
          ],
        ),
        
        // Room +/− steppers
        if (_rentalMode == 'rooms') ...[
          const SizedBox(height: 24),
          const Text(
            'Select the number of rooms:',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 16),
          
          // Validation message for room selection
          if (_totalRooms == 0 && _currentTab == 0 && _classStep == 2) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.red[50],
                border: Border.all(color: Colors.red[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Please select at least one room',
                    style: TextStyle(
                      color: Colors.red[800],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          ..._propertySubTypes
              .where((pst) => pst.typeID != 'RST001')
              .map((pst) => _buildRoomStepper(pst)),
          if (_totalRooms > 0)
            Container(
              margin: const EdgeInsets.only(top: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green[300]!),
              ),
              child: Text(
                _propertySubTypes
                    .where((pst) => (_roomCounts[pst.id] ?? 0) > 0)
                    .map((pst) => '${_roomCounts[pst.id]} × ${pst.typeName}')
                    .join('  ·  '),
                style: TextStyle(color: Colors.green[700]),
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildRentalModeCard(String icon, String title, String description, String mode) {
    final isSelected = _rentalMode == mode;
    final hasValidationError = _rentalMode.isEmpty && _currentTab == 0 && _classStep == 2;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _rentalMode = mode;
          if (mode == 'whole') {
            _roomCounts.clear();
          }
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue[50] : Colors.white,
          border: Border.all(
            color: isSelected ? Colors.blue : (hasValidationError ? Colors.red[300]! : Colors.grey[300]!),
            width: isSelected ? 2 : (hasValidationError ? 2 : 1),
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.blue.withValues(alpha: 0.2),
                    spreadRadius: 1,
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : (hasValidationError
                  ? [
                      BoxShadow(
                        color: Colors.red.withValues(alpha: 0.2),
                        spreadRadius: 1,
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.blue[700] : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? Colors.blue[600] : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomStepper(PropertySubType pst) {
    final count = _roomCounts[pst.id] ?? 0;
    final hasValidationError = _totalRooms == 0 && _currentTab == 0 && _classStep == 2 && _rentalMode == 'rooms';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: hasValidationError ? Colors.red[300]! : Colors.grey[300]!,
          width: hasValidationError ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(8),
        boxShadow: hasValidationError
            ? [
                BoxShadow(
                  color: Colors.red.withValues(alpha: 0.2),
                  spreadRadius: 1,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              pst.name,
              style: const TextStyle(fontSize: 16),
            ),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.remove),
                onPressed: count > 0 ? () => _changeRoomCount(pst.id, -1) : null,
                style: IconButton.styleFrom(
                  backgroundColor: Colors.grey[200],
                  padding: const EdgeInsets.all(8),
                ),
              ),
              Container(
                width: 40,
                alignment: Alignment.center,
                child: Text(
                  count.toString(),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _changeRoomCount(pst.id, 1),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.blue[100],
                  padding: const EdgeInsets.all(8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _renderPricing() {
    final roomUnitErrors = _getRoomUnitErrors();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Set your pricing',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        
        // Validation errors summary
        if (roomUnitErrors.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Please fix the following errors:',
                      style: TextStyle(
                        color: Colors.red[800],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ...roomUnitErrors.map((error) => Padding(
                  padding: const EdgeInsets.only(left: 28, bottom: 4),
                  child: Text(
                    '• $error',
                    style: TextStyle(color: Colors.red[700], fontSize: 14),
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        
        // Room units
        if (_roomUnits.isNotEmpty) ...[
          const Text(
            'Room Details:',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          ..._roomUnits.asMap().entries.map((entry) {
            final index = entry.key;
            final unit = entry.value;
            final hasPriceError = unit['Price'].toString().isEmpty || 
                                 double.tryParse(unit['Price'].toString()) == null ||
                                 double.parse(unit['Price'].toString()) <= 0;
            
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(
                  color: hasPriceError && _currentTab == 1 ? Colors.red[300]! : Colors.grey[300]!,
                  width: hasPriceError && _currentTab == 1 ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        unit['Label'],
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      if (hasPriceError && _currentTab == 1) ...[
                        const Spacer(),
                        Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: 'Price (SGD)',
                      prefixText: '\$',
                      border: const OutlineInputBorder(),
                      errorText: hasPriceError && _currentTab == 1 ? 'Valid price is required' : null,
                      errorStyle: TextStyle(color: Colors.red[600]),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) {
                      setState(() {
                        _roomUnits[index]['Price'] = value;
                      });
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) return 'Price is required';
                      if (double.tryParse(value) == null) return 'Invalid price';
                      if (double.parse(value) <= 0) return 'Price must be positive';
                      return null;
                    },
                  ),
                  if (hasPriceError && _currentTab == 1) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Please enter a valid positive price',
                      style: TextStyle(color: Colors.red[600], fontSize: 12),
                    ),
                  ],
                ],
              ),
            );
          }),
        ] else
          const Text('No rooms configured. Please go back and select rooms.'),
      ],
    );
  }

  Widget _renderAddress() {
    final countryError = _getFieldError('Country');
    final cityError = _getFieldError('City');
    final postalError = _getFieldError('PostalCode');
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Property Address',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        
        // Validation summary for required fields
        if ((countryError != null || cityError != null) && _currentTab == 2) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Please fix the following errors:',
                      style: TextStyle(
                        color: Colors.red[800],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (countryError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $countryError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
                if (cityError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $cityError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
                if (postalError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $postalError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
              ],
            ),
          ),
        ],
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Country *',
            border: const OutlineInputBorder(),
            errorText: countryError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: countryError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
          ),
          initialValue: _formData['Country'],
          onChanged: (value) => setState(() {
            _formData['Country'] = value;
          }),
          validator: (value) => value?.isEmpty ?? true ? 'Country is required' : null,
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'City *',
            border: const OutlineInputBorder(),
            errorText: cityError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: cityError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
          ),
          onChanged: (value) => setState(() {
            _formData['City'] = value;
          }),
          validator: (value) => value?.isEmpty ?? true ? 'City is required' : null,
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: const InputDecoration(
            labelText: 'Address',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
          onChanged: (value) => setState(() {
            _formData['Address'] = value;
          }),
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Postal Code',
            border: const OutlineInputBorder(),
            errorText: postalError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: postalError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
          ),
          onChanged: (value) => setState(() {
            _formData['PostalCode'] = value;
          }),
          validator: (value) {
            if (value?.isEmpty ?? true) return null; // Optional
            if (_formData['Country']?.toLowerCase() == 'singapore' && 
                !RegExp(r'^\d{6}$').hasMatch(value!)) {
              return 'Please enter a valid 6-digit Singapore postal code';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _renderPhysicalDetails() {
    final bedroomsError = _getFieldError('Bedrooms');
    final bathroomsError = _getFieldError('Bathrooms');
    final areaSizeError = _getFieldError('AreaSize');
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Physical Details',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        
        // Validation summary for all fields with errors
        if ((bedroomsError != null || bathroomsError != null || areaSizeError != null) && _currentTab == 3) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Please fix the following errors:',
                      style: TextStyle(
                        color: Colors.red[800],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (bedroomsError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $bedroomsError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
                if (bathroomsError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $bathroomsError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
                if (areaSizeError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $areaSizeError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
              ],
            ),
          ),
        ],
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Bedrooms *',
            border: const OutlineInputBorder(),
            errorText: bedroomsError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: bedroomsError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => setState(() {
            _formData['Bedrooms'] = value;
          }),
          validator: (value) => value?.isEmpty ?? true ? 'Number of bedrooms is required' : null,
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Bathrooms',
            border: const OutlineInputBorder(),
            errorText: bathroomsError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: bathroomsError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => setState(() {
            _formData['Bathrooms'] = value;
          }),
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Area Size (sqft)',
            border: const OutlineInputBorder(),
            errorText: areaSizeError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: areaSizeError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
            hintText: 'e.g., 800',
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => setState(() {
            _formData['AreaSize'] = value;
          }),
        ),
      ],
    );
  }

  Widget _renderLogisticsContact() {
    final availableFromError = _getFieldError('AvailableFrom');
    final contactPhoneError = _getFieldError('ContactPhone');
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Logistics & Contact',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        
        // Validation summary for required fields
        if ((availableFromError != null || contactPhoneError != null) && _currentTab == 4) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[600], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Please fix the following errors:',
                      style: TextStyle(
                        color: Colors.red[800],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (availableFromError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $availableFromError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
                if (contactPhoneError != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 28, bottom: 4),
                    child: Text('• $contactPhoneError', style: TextStyle(color: Colors.red[700], fontSize: 14)),
                  ),
              ],
            ),
          ),
        ],
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Available From *',
            border: const OutlineInputBorder(),
            errorText: availableFromError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: availableFromError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
            hintText: 'YYYY-MM-DD',
          ),
          onChanged: (value) => setState(() {
            _formData['AvailableFrom'] = value;
          }),
          validator: (value) => value?.isEmpty ?? true ? 'Availability date is required' : null,
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: InputDecoration(
            labelText: 'Contact Phone *',
            border: const OutlineInputBorder(),
            errorText: contactPhoneError,
            errorStyle: TextStyle(color: Colors.red[600]),
            suffixIcon: contactPhoneError != null ? Icon(Icons.error_outline, color: Colors.red[600]) : null,
            hintText: '+65 1234 5678',
          ),
          keyboardType: TextInputType.phone,
          onChanged: (value) => setState(() {
            _formData['ContactPhone'] = value;
          }),
          validator: (value) => value?.isEmpty ?? true ? 'Contact phone is required' : null,
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: const InputDecoration(
            labelText: 'Contact Email',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.emailAddress,
          onChanged: (value) => setState(() {
            _formData['ContactEmail'] = value;
          }),
        ),
        const SizedBox(height: 16),
        
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(
            labelText: 'Gender Preference',
            border: OutlineInputBorder(),
          ),
          initialValue: _formData['GenderPreference'],
          items: ['Any', 'Male', 'Female', 'Mixed']
              .map((gender) => DropdownMenuItem(
                    value: gender,
                    child: Text(gender),
                  ))
              .toList(),
          onChanged: (value) => setState(() {
            _formData['GenderPreference'] = value!;
          }),
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: const InputDecoration(
            labelText: 'Description',
            border: OutlineInputBorder(),
          ),
          maxLines: 4,
          onChanged: (value) => setState(() {
            _formData['Description'] = value;
          }),
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          decoration: const InputDecoration(
            labelText: 'Remarks',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
          onChanged: (value) => setState(() {
            _formData['Remark'] = value;
          }),
        ),
      ],
    );
  }

  Widget _renderReview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Review Your Listing',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Property Type: ${_getPTName(_formData['PropertyType']!)}',
                  style: const TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 8),
                Text(
                  'Rental Mode: ${_rentalMode == 'whole' ? 'Whole Unit' : 'By Room'}',
                  style: const TextStyle(fontSize: 16),
                ),
                if (_rentalMode == 'rooms') ...[
                  const SizedBox(height: 8),
                  Text(
                    'Total Rooms: $_totalRooms',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
                const SizedBox(height: 16),
                Text(
                  'Address: ${_formData['Address']}, ${_formData['City']}, ${_formData['Country']}',
                  style: const TextStyle(fontSize: 16),
                ),
                if (_formData['PostalCode']!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Postal Code: ${_formData['PostalCode']}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
                const SizedBox(height: 16),
                Text(
                  'Bedrooms: ${_formData['Bedrooms']}',
                  style: const TextStyle(fontSize: 16),
                ),
                if (_formData['Bathrooms']!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Bathrooms: ${_formData['Bathrooms']}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
                if (_formData['AreaSize']!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Area Size: ${_formData['AreaSize']} sqft',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
                const SizedBox(height: 16),
                Text(
                  'Available From: ${_formData['AvailableFrom']}',
                  style: const TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 8),
                Text(
                  'Contact: ${_formData['ContactPhone']}',
                  style: const TextStyle(fontSize: 16),
                ),
                if (_formData['ContactEmail']!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Email: ${_formData['ContactEmail']}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
                if (_formData['Description']!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'Description:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formData['Description']!,
                    style: const TextStyle(fontSize: 14),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}