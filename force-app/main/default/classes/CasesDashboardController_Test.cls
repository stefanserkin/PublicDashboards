@IsTest
private class CasesDashboardController_Test {

    private static List<String> statuses = new List<String>{'New', 'In Progress', 'Closed'};
    private static List<String> priorities = new List<String>{'High', 'Medium', 'Low'};
    private static List<String> types = new List<String>{'Electrical', 'Plumbing'};

    @TestSetup
    static void setupTestData() {
        List<Case> caseList = new List<Case>();

        // Ensure the 'Engineering' RecordType is available for Cases
        RecordType engineeringRecordType = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Engineering');
        Assert.isNotNull(null, engineeringRecordType, 'Should have received an Engineering record type for the Case object');

        // Dynamically create 10 Case records with varying properties
        for (Integer i = 0; i < 20; i++) {
            Case newCase = new Case(
                RecordTypeId = engineeringRecordType.Id,
                Status = statuses[Math.mod(i, statuses.size())], // Rotate through statuses
                Priority = priorities[Math.mod(i, priorities.size())], // Rotate through priorities
                Type = types[Math.mod(i, types.size())], // Rotate through types
                Subject = 'Case ' + i + ' Subject',
                Description = 'Case ' + i + ' Description',
                ClosedDate = (statuses[Math.mod(i, statuses.size())] == 'Closed') ? System.now() : null
            );
            caseList.add(newCase);
        }
        insert caseList;
    }

    @IsTest
    static void testGetOpenCaseStatusCounts() {
        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getOpenCaseStatusCounts();
        Test.stopTest();

        Assert.isFalse(aggregateResults.isEmpty(), 'The getOpenCaseStatusCounts should not be empty');

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = new Map<String, Integer>();
        for (AggregateResult ar : results) {
            String status = (String)ar.get('Status');
            Integer count = (Integer)ar.get('CaseCount');
            resultCountMap.put(status, count);
        }

        List<AggregateResult> expectedResults = [
            SELECT Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false
              WITH SYSTEM_MODE
             GROUP BY Status
        ];

        // Check each status count
        for (String status : statuses) {
            Integer expectedCount = // Determine the expected count based on @TestSetup data
            System.assertEquals(expectedCount, resultCountMap.get(status), 'Mismatch in count for status: ' + status);
        }
    }
    
}