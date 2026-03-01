class Property {
  final String id;
  final String title;
  final String description;
  final String propertyType;
  final String listingType;
  final String propertySubType;
  final double price;
  final String address;
  final String postalCode;
  final double? latitude;
  final double? longitude;
  final int bedrooms;
  final int bathrooms;
  final double size;
  final List<String> images;
  final String createdBy;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Property({
    required this.id,
    required this.title,
    required this.description,
    required this.propertyType,
    required this.listingType,
    required this.propertySubType,
    required this.price,
    required this.address,
    required this.postalCode,
    this.latitude,
    this.longitude,
    required this.bedrooms,
    required this.bathrooms,
    required this.size,
    required this.images,
    required this.createdBy,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      propertyType: json['propertyType'] ?? '',
      listingType: json['listingType'] ?? '',
      propertySubType: json['propertySubType'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      address: json['address'] ?? '',
      postalCode: json['postalCode'] ?? '',
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      bedrooms: json['bedrooms'] ?? 0,
      bathrooms: json['bathrooms'] ?? 0,
      size: (json['size'] ?? 0).toDouble(),
      images: List<String>.from(json['images'] ?? []),
      createdBy: json['createdBy'] ?? '',
      status: json['status'] ?? 'active',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'propertyType': propertyType,
      'listingType': listingType,
      'propertySubType': propertySubType,
      'price': price,
      'address': address,
      'postalCode': postalCode,
      'latitude': latitude,
      'longitude': longitude,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'size': size,
      'images': images,
      'createdBy': createdBy,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}