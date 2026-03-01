import 'dart:math';

// Haversine distance calculation (same as web project)
double haversine(double lat1, double lng1, double lat2, double lng2) {
  const R = 6371; // Earth's radius in kilometers
  
  final dLat = (lat2 - lat1) * (pi / 180);
  final dLng = (lng2 - lng1) * (pi / 180);
  
  final a = pow(sin(dLat / 2), 2) + 
            cos(lat1 * (pi / 180)) * cos(lat2 * (pi / 180)) * 
            pow(sin(dLng / 2), 2);
  
  return R * 2 * atan2(sqrt(a), sqrt(1 - a));
}

// Geocode MRT station using Nominatim (OpenStreetMap)
Future<Map<String, double>?> geocodeQuery(String query, {String countryCode = ''}) async {
  try {
    // Rate limiting: wait 1.2 seconds between requests (same as web)
    await Future.delayed(const Duration(milliseconds: 1200));
    
    // Note: In a real implementation, you'd use http package
    // For now, return null as we don't have http dependency
    
    return null;
  } catch (e) {
    return null;
  }
}

// Geocode using Singapore's OneMap API
Future<Map<String, double>?> geocodePostalSG(String postalCode) async {
  try {
    // Note: In a real implementation, you'd use http package
    // For now, return null as we don't have http dependency
    
    return null;
  } catch (e) {
    return null;
  }
}

// Mock MRT station coordinates for now (until geocoding is implemented)
final Map<String, Map<String, double>> mrtStationCoordinates = {
  'Admiralty MRT': {'lat': 1.4416, 'lng': 103.8005},
  'Aljunied MRT': {'lat': 1.3167, 'lng': 103.8828},
  'Ang Mo Kio MRT': {'lat': 1.3698, 'lng': 103.8502},
  'Bartley MRT': {'lat': 1.3429, 'lng': 103.8861},
  'Bayfront MRT': {'lat': 1.2818, 'lng': 103.8565},
  'Beauty World MRT': {'lat': 1.3409, 'lng': 103.7757},
  'Bedok MRT': {'lat': 1.3239, 'lng': 103.9278},
  'Bedok North MRT': {'lat': 1.3347, 'lng': 103.9176},
  'Bedok Reservoir MRT': {'lat': 1.3329, 'lng': 103.9236},
  'Bencoolen MRT': {'lat': 1.2987, 'lng': 103.8494},
  'Bendemeer MRT': {'lat': 1.3134, 'lng': 103.8647},
  'Bishan MRT': {'lat': 1.3512, 'lng': 103.8492},
  'Boon Keng MRT': {'lat': 1.3137, 'lng': 103.8619},
  'Boon Lay MRT': {'lat': 1.3388, 'lng': 103.7064},
  'Botanic Gardens MRT': {'lat': 1.3126, 'lng': 103.8154},
  'Braddell MRT': {'lat': 1.3540, 'lng': 103.8394},
  'Bras Basah MRT': {'lat': 1.2966, 'lng': 103.8505},
  'Buangkok MRT': {'lat': 1.3829, 'lng': 103.8775},
  'Bugis MRT': {'lat': 1.3006, 'lng': 103.8558},
  'Bukit Batok MRT': {'lat': 1.3590, 'lng': 103.7634},
  'Bukit Brown MRT': {'lat': 1.3333, 'lng': 103.8333},
  'Bukit Gombak MRT': {'lat': 1.3587, 'lng': 103.7492},
  'Bukit Panjang MRT': {'lat': 1.3781, 'lng': 103.7633},
  'Buona Vista MRT': {'lat': 1.3066, 'lng': 103.7903},
  'Caldecott MRT': {'lat': 1.3378, 'lng': 103.8394},
  'Canberra MRT': {'lat': 1.4327, 'lng': 103.8247},
  'Cantonment MRT': {'lat': 1.2767, 'lng': 103.8389},
  'Cashew MRT': {'lat': 1.3803, 'lng': 103.7664},
  'Changi Airport MRT': {'lat': 1.3644, 'lng': 103.9915},
  'Chinatown MRT': {'lat': 1.2868, 'lng': 103.8445},
  'Chinese Garden MRT': {'lat': 1.3423, 'lng': 103.7318},
  'Choa Chu Kang MRT': {'lat': 1.3852, 'lng': 103.7444},
  'City Hall MRT': {'lat': 1.2932, 'lng': 103.8520},
  'Clementi MRT': {'lat': 1.3151, 'lng': 103.7654},
  'Commonwealth MRT': {'lat': 1.3025, 'lng': 103.7981},
  'Dakota MRT': {'lat': 1.3084, 'lng': 103.8886},
  'Dhoby Ghaut MRT': {'lat': 1.2986, 'lng': 103.8456},
  'Dover MRT': {'lat': 1.3114, 'lng': 103.7789},
  'Downtown MRT': {'lat': 1.2794, 'lng': 103.8521},
  'Esplanade MRT': {'lat': 1.2931, 'lng': 103.8551},
  'Eunos MRT': {'lat': 1.3197, 'lng': 103.9003},
  'Expo MRT': {'lat': 1.3344, 'lng': 103.9615},
  'Farrer Park MRT': {'lat': 1.3129, 'lng': 103.8542},
  'Farrer Road MRT': {'lat': 1.3175, 'lng': 103.8078},
  'Fort Canning MRT': {'lat': 1.2914, 'lng': 103.8447},
  'Geylang Bahru MRT': {'lat': 1.3214, 'lng': 103.8717},
  'Gul Circle MRT': {'lat': 1.3194, 'lng': 103.6781},
  'HarbourFront MRT': {'lat': 1.2654, 'lng': 103.8217},
  'Haw Par Villa MRT': {'lat': 1.2825, 'lng': 103.7817},
  'Hillview MRT': {'lat': 1.3625, 'lng': 103.7675},
  'Holland Village MRT': {'lat': 1.3069, 'lng': 103.7956},
  'Hougang MRT': {'lat': 1.3711, 'lng': 103.8922},
  'Jalan Besar MRT': {'lat': 1.3056, 'lng': 103.8556},
  'Joo Koon MRT': {'lat': 1.3275, 'lng': 103.6781},
  'Jurong East MRT': {'lat': 1.3329, 'lng': 103.7436},
  'Kaki Bukit MRT': {'lat': 1.3347, 'lng': 103.9086},
  'Kallang MRT': {'lat': 1.3119, 'lng': 103.8714},
  'Kembangan MRT': {'lat': 1.3214, 'lng': 103.9042},
  'Kent Ridge MRT': {'lat': 1.2936, 'lng': 103.7847},
  'Khatib MRT': {'lat': 1.4175, 'lng': 103.8328},
  'King Albert Park MRT': {'lat': 1.3356, 'lng': 103.7756},
  'Kovan MRT': {'lat': 1.3603, 'lng': 103.8847},
  'Kranji MRT': {'lat': 1.425, 'lng': 103.7625},
  'Labrador Park MRT': {'lat': 1.2722, 'lng': 103.8042},
  'Lakeside MRT': {'lat': 1.3444, 'lng': 103.7217},
  'Lavender MRT': {'lat': 1.3078, 'lng': 103.8639},
  'Lorong Chuan MRT': {'lat': 1.3517, 'lng': 103.8647},
  'MacPherson MRT': {'lat': 1.3261, 'lng': 103.89},
  'Marina Bay MRT': {'lat': 1.2761, 'lng': 103.8547},
  'Marina South Pier MRT': {'lat': 1.2708, 'lng': 103.8625},
  'Marsiling MRT': {'lat': 1.4328, 'lng': 103.7756},
  'Marymount MRT': {'lat': 1.3497, 'lng': 103.8394},
  'Mattar MRT': {'lat': 1.3269, 'lng': 103.8833},
  'Maxwell MRT': {'lat': 1.2989, 'lng': 103.8389},
  'Mountbatten MRT': {'lat': 1.3031, 'lng': 103.8825},
  'Newton MRT': {'lat': 1.3131, 'lng': 103.8361},
  'Nicoll Highway MRT': {'lat': 1.3047, 'lng': 103.8606},
  'Novena MRT': {'lat': 1.3203, 'lng': 103.8439},
  'one-north MRT': {'lat': 1.2997, 'lng': 103.7875},
  'Orchard MRT': {'lat': 1.3042, 'lng': 103.8317},
  'Outram Park MRT': {'lat': 1.2806, 'lng': 103.8397},
  'Pasir Panjang MRT': {'lat': 1.2767, 'lng': 103.7917},
  'Pasir Ris MRT': {'lat': 1.3744, 'lng': 103.9494},
  'Paya Lebar MRT': {'lat': 1.3178, 'lng': 103.8925},
  'Pioneer MRT': {'lat': 1.3125, 'lng': 103.6972},
  'Potong Pasir MRT': {'lat': 1.3306, 'lng': 103.8647},
  'Promenade MRT': {'lat': 1.2933, 'lng': 103.8606},
  'Punggol MRT': {'lat': 1.4056, 'lng': 103.9028},
  'Queenstown MRT': {'lat': 1.2936, 'lng': 103.8061},
  'Raffles Place MRT': {'lat': 1.2837, 'lng': 103.852},
  'Redhill MRT': {'lat': 1.2897, 'lng': 103.8167},
  'Rochor MRT': {'lat': 1.3039, 'lng': 103.8506},
  'Sembawang MRT': {'lat': 1.4492, 'lng': 103.82},
  'Sengkang MRT': {'lat': 1.3917, 'lng': 103.8944},
  'Serangoon MRT': {'lat': 1.3497, 'lng': 103.8733},
  'Shenton Way MRT': {'lat': 1.2783, 'lng': 103.8506},
  'Simei MRT': {'lat': 1.3433, 'lng': 103.9525},
  'Somerset MRT': {'lat': 1.3047, 'lng': 103.8397},
  'Stadium MRT': {'lat': 1.3028, 'lng': 103.8753},
  'Stevens MRT': {'lat': 1.3208, 'lng': 103.8258},
  'Tai Seng MRT': {'lat': 1.3356, 'lng': 103.8886},
  'Tampines MRT': {'lat': 1.3536, 'lng': 103.9444},
  'Tampines East MRT': {'lat': 1.3594, 'lng': 103.9547},
  'Tampines West MRT': {'lat': 1.3478, 'lng': 103.9342},
  'Tan Kah Kee MRT': {'lat': 1.3256, 'lng': 103.8078},
  'Tanah Merah MRT': {'lat': 1.3278, 'lng': 103.9467},
  'Tanjong Pagar MRT': {'lat': 1.2764, 'lng': 103.8456},
  'Telok Ayer MRT': {'lat': 1.2822, 'lng': 103.8494},
  'Telok Blangah MRT': {'lat': 1.2708, 'lng': 103.8039},
  'Tiong Bahru MRT': {'lat': 1.2861, 'lng': 103.8267},
  'Toa Payoh MRT': {'lat': 1.3325, 'lng': 103.8478},
  'Tuas Crescent MRT': {'lat': 1.3294, 'lng': 103.6389},
  'Tuas Link MRT': {'lat': 1.3306, 'lng': 103.6208},
  'Tuas West Road MRT': {'lat': 1.3292, 'lng': 103.6597},
  'Ubi MRT': {'lat': 1.3297, 'lng': 103.8997},
  'Upper Changi MRT': {'lat': 1.3419, 'lng': 103.9469},
  'Woodlands MRT': {'lat': 1.4361, 'lng': 103.7864},
  'Woodlands North MRT': {'lat': 1.4475, 'lng': 103.7856},
  'Woodlands South MRT': {'lat': 1.4247, 'lng': 103.7872},
  'Yew Tee MRT': {'lat': 1.3975, 'lng': 103.7475},
  'Yio Chu Kang MRT': {'lat': 1.3817, 'lng': 103.8453},
  'Yishun MRT': {'lat': 1.4294, 'lng': 103.835},
};