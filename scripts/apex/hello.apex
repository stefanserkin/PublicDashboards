// Use .apex files to store anonymous Apex.
// You can execute anonymous Apex in VS Code by selecting the
//     apex text and running the command:
//     SFDX: Execute Anonymous Apex with Currently Selected Text
// You can also execute the entire file by running the command:
//     SFDX: Execute Anonymous Apex with Editor Contents

String invalidString = 'not_a_valid_base64_string';
try {
   String fileid = CasesDashboardController.saveAsImage(invalidString, 'fileName');
} catch (Exception e) {
    System.debug('::::: exception --> ' + e.getMessage());
}

