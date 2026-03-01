import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/property.dart';
import '../models/lookup.dart';

class ApiService {
  static const String baseUrl = 'https://nay-yar.onrender.com/api';

  // Utility methods
  static Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl/$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(body),
    );
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$endpoint'),
      headers: {'Cache-Control': 'no-store'},
    );
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(body),
    );
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> delete(String endpoint) async {
    final response = await http.delete(Uri.parse('$baseUrl/$endpoint'));
    return json.decode(response.body);
  }

  // Auth methods
  static Future<Map<String, dynamic>> login(Map<String, dynamic> credentials) async {
    return await post('login', credentials);
  }

  static Future<Map<String, dynamic>> signup(Map<String, dynamic> userData) async {
    return await post('signup', userData);
  }

  static Future<Map<String, dynamic>> loginRaw(Map<String, dynamic> credentials) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(credentials),
    );
    final data = json.decode(response.body);
    return {'res': {'status': response.statusCode, 'ok': response.statusCode == 200}, 'data': data};
  }

  static Future<Map<String, dynamic>> signupRaw(Map<String, dynamic> userData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/signup'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(userData),
    );
    final data = json.decode(response.body);
    return {'res': {'status': response.statusCode, 'ok': response.statusCode == 200}, 'data': data};
  }

  static Future<Map<String, dynamic>> resetPasswordRaw(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/reset-password'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(payload),
    );
    final data = json.decode(response.body);
    return {'res': {'status': response.statusCode, 'ok': response.statusCode == 200}, 'data': data};
  }

  static Future<Map<String, dynamic>> changePasswordRaw(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users/change-password'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(payload),
    );
    final data = json.decode(response.body);
    return {'res': {'status': response.statusCode, 'ok': response.statusCode == 200}, 'data': data};
  }

  static Future<User> getUserProfile(String userID) async {
    final data = await get('users/${Uri.encodeComponent(userID)}');
    return User.fromJson(data);
  }

  static Future<Map<String, dynamic>> updateUserProfileRaw(String userID, Map<String, dynamic> payload) async {
    final response = await http.put(
      Uri.parse('$baseUrl/users/${Uri.encodeComponent(userID)}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(payload),
    );
    final data = json.decode(response.body);
    return {'res': {'status': response.statusCode, 'ok': response.statusCode == 200}, 'data': data};
  }

  // Lookup methods
  static Future<List<PropertyType>> getPropertyTypes() async {
    final data = await get('property-types');
    return (data as List).map((item) => PropertyType.fromJson(item)).toList();
  }

  static Future<List<ListingType>> getListingTypes() async {
    final data = await get('listing-types');
    return (data as List).map((item) => ListingType.fromJson(item)).toList();
  }

  static Future<List<PropertySubType>> getPropertySubTypes() async {
    final data = await get('property-subtypes');
    return (data as List).map((item) => PropertySubType.fromJson(item)).toList();
  }

  static Future<Map<String, List<dynamic>>> getAllLookups() async {
    final results = await Future.wait([
      getPropertyTypes(),
      getListingTypes(),
      getPropertySubTypes(),
    ]);
    
    return {
      'ptData': results[0],
      'ltData': results[1],
      'pstData': results[2],
    };
  }

  // Listing methods
  static Future<Map<String, dynamic>> createListing(Map<String, dynamic> payload) async {
    return await post('listings', payload);
  }

  static Future<List<Property>> getAllListings() async {
    final data = await get('listings');
    return (data as List).map((item) => Property.fromJson(item)).toList();
  }

  static Future<List<Property>> getMyListings(String createdBy) async {
    final data = await get('listings?createdBy=${Uri.encodeComponent(createdBy)}');
    return (data as List).map((item) => Property.fromJson(item)).toList();
  }

  static Future<Property> getListingById(String id) async {
    final data = await get('listings/$id');
    return Property.fromJson(data);
  }

  static Future<Map<String, dynamic>> updateListing(String id, Map<String, dynamic> payload) async {
    return await put('listings/$id', payload);
  }

  static Future<Map<String, dynamic>> deleteListing(String id) async {
    return await delete('listings/$id');
  }

  static Future<Map<String, dynamic>> markListingClosed(String id) async {
    final response = await http.patch(Uri.parse('$baseUrl/listings/$id/close'));
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> reopenListing(String id) async {
    final response = await http.patch(Uri.parse('$baseUrl/listings/$id/reopen'));
    return json.decode(response.body);
  }

  // Feedback methods
  static Future<Map<String, dynamic>> submitFeedback(Map<String, dynamic> payload) async {
    return await post('feedback', payload);
  }

  static Future<List<dynamic>> getFeedbacks(String userID) async {
    final data = await get('feedback?userID=${Uri.encodeComponent(userID)}');
    return data as List;
  }

  // Analytics methods
  static Future<Map<String, dynamic>> trackLinkHit(String key, String url) async {
    return await post('link-hits', {'key': key, 'url': url});
  }

  static Future<List<dynamic>> getLinkHits(String userID) async {
    final data = await get('link-hits?userID=${Uri.encodeComponent(userID)}');
    return data as List;
  }

  // User methods
  static Future<List<dynamic>> getUsers(String userID) async {
    final data = await get('users?userID=${Uri.encodeComponent(userID)}');
    return data as List;
  }

  // Geocoding methods - matching nay-yar-web functionality
  static Future<Map<String, double>?> fetchGeocode(String address) async {
    try {
      // Try OneMap API first (Singapore-specific)
      final onemapResult = await _geocodeOneMap(address);
      if (onemapResult != null) return onemapResult;
      
      // Fallback to Nominatim
      return await _geocodeNominatim(address);
    } catch (e) {
      // Handle geocoding error silently in production
      return null;
    }
  }

  static Future<Map<String, double>?> _geocodeOneMap(String address) async {
    try {
      final response = await http.get(
        Uri.parse('https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${Uri.encodeComponent(address)}&returnGeom=Y&getAddrDetails=Y'),
        headers: {'Accept': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['results'] != null && data['results'].isNotEmpty) {
          final result = data['results'][0];
          return {
            'lat': double.parse(result['LATITUDE']),
            'lng': double.parse(result['LONGITUDE']),
          };
        }
      }
    } catch (e) {
      // Handle OneMap geocoding error silently in production
    }
    return null;
  }

  static Future<Map<String, double>?> _geocodeNominatim(String address) async {
    try {
      final response = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(address)}&limit=1'),
        headers: {'User-Agent': 'NayYarApp/1.0'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data.isNotEmpty) {
          return {
            'lat': double.parse(data[0]['lat']),
            'lng': double.parse(data[0]['lon']),
          };
        }
      }
    } catch (e) {
      // Handle Nominatim geocoding error silently in production
    }
    return null;
  }

  static Future<Map<String, double>?> geocodePostalSG(String postalCode) async {
    try {
      // Singapore postal code format: 6 digits
      if (postalCode.length != 6 || !RegExp(r'^\d{6}$').hasMatch(postalCode)) {
        return null;
      }
      
      // Use OneMap API for Singapore postal codes
      final response = await http.get(
        Uri.parse('https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${Uri.encodeComponent(postalCode)}&returnGeom=Y&getAddrDetails=Y'),
        headers: {'Accept': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['results'] != null && data['results'].isNotEmpty) {
          final result = data['results'][0];
          return {
            'lat': double.parse(result['LATITUDE']),
            'lng': double.parse(result['LONGITUDE']),
          };
        }
      }
    } catch (e) {
      // Handle postal code geocoding error silently in production
    }
    return null;
  }
}