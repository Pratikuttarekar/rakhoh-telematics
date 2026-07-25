import 'package:flutter/material.dart';
import '../services/gps_service.dart';
import '../services/excel_exporter.dart';
import 'login_screen.dart';

class EngineerHomeScreen extends StatefulWidget {
  final String engineerName;
  final String engineerId;

  const EngineerHomeScreen({
    super.key,
    required this.engineerName,
    required this.engineerId,
  });

  @override
  State<EngineerHomeScreen> createState() => _EngineerHomeScreenState();
}

class _EngineerHomeScreenState extends State<EngineerHomeScreen> {
  String selectedTab = 'today';
  bool isGPSTracking = false;

  final List<Map<String, dynamic>> _mockSites = [
    {
      'siteId': 'SITE_1001',
      'clientName': 'ABC Boiler Unit',
      'clientPhone': '+919123456789',
      'address': 'Plot 12, Industrial Area, Chinchwad, Pune',
      'scheduledDate': '2026-07-24',
      'category': 'today',
      'status': 'working',
      'geofenceRadiusMeters': 100,
      'notes': 'Annual boiler safety check & thermal efficiency calibration.',
    },
    {
      'siteId': 'SITE_1002',
      'clientName': 'Thermax Power Plant',
      'clientPhone': '+919123456790',
      'address': 'MIDC Phase II, Akurdi, Pune',
      'scheduledDate': '2026-07-24',
      'category': 'today',
      'status': 'completed',
      'completedAt': '2026-07-24 11:30 AM',
      'workSummary': 'Steam valve actuator replaced & tested successfully.',
      'geofenceRadiusMeters': 100,
      'notes': 'Steam valve actuator replacement and leakage inspection.',
    },
    {
      'siteId': 'SITE_1003',
      'clientName': 'Forbes Marshall Plant',
      'clientPhone': '+919123456791',
      'address': 'Kasarwadi Industrial Sector, Pune',
      'scheduledDate': '2026-07-25',
      'category': 'tomorrow',
      'status': 'pending',
      'geofenceRadiusMeters': 100,
      'notes': 'Control panel software patch & flow meter calibration.',
    },
    {
      'siteId': 'SITE_1004',
      'clientName': 'Tata Motors Boiler Section',
      'clientPhone': '+919123456792',
      'address': 'Gate 4, Pimpri Works, Pune',
      'scheduledDate': '2026-07-26',
      'category': 'upcoming',
      'status': 'pending',
      'geofenceRadiusMeters': 100,
      'notes': 'Quarterly heat exchanger overhaul.',
    },
  ];

  @override
  void initState() {
    super.initState();
    // Auto-start high accuracy GPS tracking to RTDB /live_locations
    _toggleGPSTracking();
  }

  void _toggleGPSTracking() {
    final gps = GPSTrackingService();
    if (gps.isTracking) {
      gps.stopLiveTracking();
      setState(() => isGPSTracking = false);
    } else {
      gps.startLiveTracking(widget.engineerId, widget.engineerName);
      setState(() => isGPSTracking = true);
    }
  }

  void _exportExcelLogs() async {
    final completed = _mockSites.where((s) => s['status'] == 'completed').toList();
    if (completed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No completed sites found for your account to export.'),
          backgroundColor: Colors.amber,
        ),
      );
      return;
    }

    final path = await MobileExcelExporter.exportCompletedDutyLogsToExcel(
      engineerName: widget.engineerName,
      completedSites: completed,
    );

    if (!mounted) return;

    if (path != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Exported Excel (.xlsx) to:\n$path'),
          backgroundColor: const Color(0xFF10B981),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _mockSites.where((s) => s['category'] == selectedTab).toList();
    final completedCount = _mockSites.where((s) => s['status'] == 'completed').length;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF121827),
        elevation: 0,
        title: Row(
          children: [
            const CircleAvatar(
              radius: 18,
              backgroundColor: Color(0xFF00F2FE),
              child: Icon(Icons.person, color: Color(0xFF090D16)),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.engineerName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Text(
                  'ID: #${widget.engineerId}',
                  style: TextStyle(fontSize: 10, color: Colors.grey[400]),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // GPS Streaming Status Toggle Badge
          GestureDetector(
            onTap: _toggleGPSTracking,
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isGPSTracking ? Colors.emerald.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isGPSTracking ? Colors.emerald : Colors.red,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.gps_fixed,
                    size: 14,
                    color: isGPSTracking ? Colors.emerald : Colors.red,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isGPSTracking ? 'GPS LIVE' : 'GPS PAUSED',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isGPSTracking ? Colors.emerald : Colors.red,
                    ),
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
            onPressed: () {
              GPSTrackingService().stopLiveTracking();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Schedule Tabs
          Container(
            color: const Color(0xFF121827),
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                _buildTabButton('today', 'Today (${_mockSites.where((s) => s['category'] == 'today').length})'),
                const SizedBox(width: 8),
                _buildTabButton('tomorrow', 'Tomorrow (${_mockSites.where((s) => s['category'] == 'tomorrow').length})'),
                const SizedBox(width: 8),
                _buildTabButton('upcoming', 'Upcoming (${_mockSites.where((s) => s['category'] == 'upcoming').length})'),
              ],
            ),
          ),

          // Export Excel Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFF0F172A),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.table_chart, color: Color(0xFF10B981), size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Completed Sites Log ($completedCount)',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: _exportExcelLogs,
                  icon: const Icon(Icons.download, size: 14),
                  label: const Text('Export .xlsx', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: const Color(0xFF090D16),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          // Site Cards List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final site = filtered[index];
                return Card(
                  color: const Color(0xFF121827),
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: const BorderSide(color: Colors.white12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              site['siteId'],
                              style: const TextStyle(
                                color: Color(0xFF00F2FE),
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: site['status'] == 'completed'
                                    ? Colors.emerald.withOpacity(0.2)
                                    : site['status'] == 'working'
                                        ? Colors.blue.withOpacity(0.2)
                                        : Colors.amber.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                (site['status'] as String).toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: site['status'] == 'completed'
                                      ? Colors.emerald
                                      : site['status'] == 'working'
                                          ? Colors.blue
                                          : Colors.amber,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          site['clientName'],
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 14, color: Color(0xFF00F2FE)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                site['address'],
                                style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.phone, size: 14),
                              label: const Text('Call Client', style: TextStyle(fontSize: 11)),
                            ),
                            ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.play_arrow, size: 14),
                              label: const Text('Start Active Job', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF00F2FE),
                                foregroundColor: const Color(0xFF090D16),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String tabKey, String label) {
    final isSelected = selectedTab == tabKey;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => selectedTab = tabKey),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF00F2FE) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isSelected ? const Color(0xFF090D16) : Colors.grey[400],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
