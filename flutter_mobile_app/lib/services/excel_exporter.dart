import 'dart:io';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';

class MobileExcelExporter {
  static Future<String?> exportCompletedDutyLogsToExcel({
    required String engineerName,
    required List<Map<String, dynamic>> completedSites,
  }) async {
    try {
      final excel = Excel.createExcel();
      final Sheet sheet = excel['Completed Duty Logs'];
      excel.delete('Sheet1');

      // Add Headers
      sheet.appendRow([
        TextCellValue('Site ID'),
        TextCellValue('Client Name'),
        TextCellValue('Site Address'),
        TextCellValue('Scheduled Date'),
        TextCellValue('Completion Date'),
        TextCellValue('Status'),
        TextCellValue('Work Summary'),
      ]);

      // Add Data Rows
      for (var site in completedSites) {
        sheet.appendRow([
          TextCellValue(site['siteId'] ?? 'N/A'),
          TextCellValue(site['clientName'] ?? 'N/A'),
          TextCellValue(site['address'] ?? 'N/A'),
          TextCellValue(site['scheduledDate'] ?? 'N/A'),
          TextCellValue(site['completedAt'] ?? 'Completed'),
          TextCellValue((site['status'] ?? 'COMPLETED').toString().toUpperCase()),
          TextCellValue(site['workSummary'] ?? 'N/A'),
        ]);
      }

      final Directory directory = await getApplicationDocumentsDirectory();
      final String formattedName = engineerName.trim().replaceAll(' ', '_');
      final String dateStr = DateTime.now().toIso8601String().substring(0, 10);
      final String filePath = '${directory.path}/${formattedName}_Completed_Sites_$dateStr.xlsx';

      final fileBytes = excel.save();
      if (fileBytes != null) {
        final File file = File(filePath);
        await file.writeAsBytes(fileBytes, flush: true);
        return filePath;
      }
    } catch (e) {
      print('Excel Export Error: $e');
    }
    return null;
  }
}
