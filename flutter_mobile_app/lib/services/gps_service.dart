import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';

class GPSTrackingService {
  static final GPSTrackingService _instance = GPSTrackingService._internal();
  factory GPSTrackingService() => _instance;
  GPSTrackingService._internal();

  StreamSubscription<Position>? _positionStreamSub;
  bool isTracking = false;

  Future<bool> checkAndRequestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('GPS Location services disabled.');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  void startLiveTracking(String engineerId, String engineerName) async {
    bool hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) return;

    isTracking = true;
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // Stream position update every 5 meters
    );

    _positionStreamSub = Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen((Position position) {
      _pushLocationToRTDB(engineerId, engineerName, position);
    });
  }

  void _pushLocationToRTDB(String engineerId, String engineerName, Position pos) {
    try {
      final DatabaseReference rtdbRef =
          FirebaseDatabase.instance.ref('live_locations/$engineerId');

      final Map<String, dynamic> locationData = {
        'engineerId': engineerId,
        'engineerName': engineerName,
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        'speedKmh': (pos.speed * 3.6).roundToDouble(), // m/s to km/h
        'heading': pos.heading,
        'batteryPercentage': 90,
        'isOnline': true,
        'lastUpdated': DateTime.now().millisecondsSinceEpoch,
      };

      rtdbRef.set(locationData);
      debugPrint('RTDB GPS Push: ${pos.latitude}, ${pos.longitude}');
    } catch (e) {
      debugPrint('RTDB Push Error: $e');
    }
  }

  void stopLiveTracking() {
    _positionStreamSub?.cancel();
    isTracking = false;
  }
}
