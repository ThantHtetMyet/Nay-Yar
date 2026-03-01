class PropertyType {
  final String id;
  final String name;
  final String description;

  PropertyType({
    required this.id,
    required this.name,
    required this.description,
  });

  factory PropertyType.fromJson(Map<String, dynamic> json) {
    return PropertyType(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
    };
  }
}

class ListingType {
  final String id;
  final String name;
  final String description;

  ListingType({
    required this.id,
    required this.name,
    required this.description,
  });

  factory ListingType.fromJson(Map<String, dynamic> json) {
    return ListingType(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
    };
  }
}

class PropertySubType {
  final String id;
  final String name;
  final String description;
  final String propertyTypeId;
  
  // Aliases for backward compatibility
  String get typeID => id;
  String get typeName => name;

  PropertySubType({
    required this.id,
    required this.name,
    required this.description,
    required this.propertyTypeId,
  });

  factory PropertySubType.fromJson(Map<String, dynamic> json) {
    return PropertySubType(
      id: json['id'] ?? json['typeID'] ?? '',
      name: json['name'] ?? json['typeName'] ?? '',
      description: json['description'] ?? '',
      propertyTypeId: json['propertyTypeId'] ?? json['propertyTypeID'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'propertyTypeId': propertyTypeId,
    };
  }
}