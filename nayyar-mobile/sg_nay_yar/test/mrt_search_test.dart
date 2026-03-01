import 'package:flutter_test/flutter_test.dart';
import 'package:sg_nay_yar/utils/map_utils.dart';
import 'package:sg_nay_yar/models/mrt_station.dart';

void main() {
  group('MRT Search Functionality', () {
    test('MRT stations list should contain expected stations', () {
      expect(mrtStations, isNotEmpty);
      expect(mrtStations, contains('Orchard MRT'));
      expect(mrtStations, contains('Raffles Place MRT'));
      expect(mrtStations, contains('Marina Bay MRT'));
    });

    test('Haversine distance calculation should work correctly', () {
      // Test with known coordinates
      // Singapore CBD area coordinates
      final distance = haversine(
        1.2833, // Raffles Place MRT latitude
        103.8607, // Raffles Place MRT longitude
        1.3048, // Orchard MRT latitude
        103.8315, // Orchard MRT longitude
      );
      
      // Distance should be approximately 2-3 km
      expect(distance, greaterThan(1.0));
      expect(distance, lessThan(5.0));
    });

    test('Mock MRT coordinates should be available', () {
      expect(mrtStationCoordinates, isNotEmpty);
      expect(mrtStationCoordinates['Orchard MRT'], isNotNull);
      expect(mrtStationCoordinates['Raffles Place MRT'], isNotNull);
      expect(mrtStationCoordinates['Orchard MRT']!['lat'], isNotNull);
      expect(mrtStationCoordinates['Orchard MRT']!['lng'], isNotNull);
    });

    test('MRT station coordinates should be within Singapore bounds', () {
      // Singapore latitude bounds: ~1.1 to 1.5
      // Singapore longitude bounds: ~103.6 to 104.1
      
      mrtStationCoordinates.forEach((station, coords) {
        expect(coords['lat'], greaterThan(1.0));
        expect(coords['lat'], lessThan(2.0));
        expect(coords['lng'], greaterThan(103.0));
        expect(coords['lng'], lessThan(105.0));
      });
    });
  });
}