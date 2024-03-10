@IsTest
private class CasesDashboardController_Test {

    private static List<String> statuses = new List<String>{'New', 'In Progress', 'Closed'};
    private static List<String> priorities = new List<String>{'High', 'Medium', 'Low'};
    private static List<String> types = new List<String>{'Electrical', 'Plumbing'};

    private static Id engineeringRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByDeveloperName()
                                                    .get('Engineering').getRecordTypeId();

    // A Base64 representation of a 1x1 pixel transparent PNG
    private static final String BASE64_STRING = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wAAAgcB9FvRx14AAAAASUVORK5CYII=';
    
    /**
     * Set up 20 cases with a mix statuses, priorities, and types
     */
    @TestSetup
    static void setupTestData() {
        Contact ct = TestDataFactory.createContacts(1)[0];
        insert ct;

        // Ensure the 'Engineering' RecordType is available for Cases
        Assert.isNotNull(engineeringRecordTypeId, 'Should have received an Engineering record type for the Case object');

        List<Case> caseList = new List<Case>();
        // Dynamically create 10 Case records with varying properties
        for (Integer i = 0; i < 20; i++) {
            Case newCase = new Case(
                RecordTypeId = engineeringRecordTypeId,
                ContactId = ct.Id,
                Status = statuses[Math.mod(i, statuses.size())], // Rotate through statuses
                Priority = priorities[Math.mod(i, priorities.size())], // Rotate through priorities
                Type = types[Math.mod(i, types.size())], // Rotate through types
                Subject = 'Case ' + i + ' Subject',
                Description = 'Case ' + i + ' Description'
            );
            caseList.add(newCase);
        }
        insert caseList;
    }

    /**
     * Test open case status counts
     */
    @IsTest
    static void testGetOpenCaseStatusCounts() {
        String groupingProperty = 'Status';
        String countProperty = 'CaseCount';

        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getOpenCaseStatusCounts();
        Test.stopTest();

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = getResultCountMap(
            aggregateResults, groupingProperty, countProperty
        );

        List<AggregateResult> expectedResults = [
            SELECT Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false
              WITH SYSTEM_MODE
             GROUP BY Status
        ];
        Map<String, Integer> expectedCounts = getResultCountMap(
            expectedResults, groupingProperty, countProperty
        );

        // Assert that each expected count matches the actual count
        for (String grouping : expectedCounts.keySet()) {
            Assert.areEqual(
                expectedCounts.get(grouping), 
                resultCountMap.get(grouping), 
                'Mismatch in count for ' + grouping
            );
        }
    }

    /**
     * Test open case owner counts
     */
    @IsTest
    static void testGetOpenCaseOwnerCounts() {
        String groupingProperty = 'CaseOwner';
        String subGroupingProperty = 'Status';
        String countProperty = 'CaseCount';

        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getOpenCaseOwnerCounts();
        Test.stopTest();

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = getStackedResultCountMap(
            aggregateResults, groupingProperty, subGroupingProperty, countProperty
        );

        List<AggregateResult> expectedResults = [
            SELECT Owner.Name CaseOwner, Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false 
               AND Owner.Type = 'User'
              WITH SYSTEM_MODE
             GROUP BY Owner.Name, Status
             ORDER BY COUNT(Id) DESC
        ];
        Map<String, Integer> expectedCounts = getStackedResultCountMap(
            expectedResults, groupingProperty, subGroupingProperty, countProperty
        );

        // Assert that each expected count matches the actual count
        for (String grouping : expectedCounts.keySet()) {
            Assert.areEqual(
                expectedCounts.get(grouping), 
                resultCountMap.get(grouping), 
                'Mismatch in count for ' + grouping
            );
        }
    }
    
    /**
     * Test open case priority counts
     */
    @IsTest
    static void testGetOpenCasePriorityCounts() {
        String groupingProperty = 'Priority';
        String subGroupingProperty = 'Status';
        String countProperty = 'CaseCount';

        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getOpenCasePriorityCounts();
        Test.stopTest();

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = getStackedResultCountMap(
            aggregateResults, groupingProperty, subGroupingProperty, countProperty
        );

        List<AggregateResult> expectedResults = [
            SELECT Priority, Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false 
              WITH SYSTEM_MODE
             GROUP BY Priority, Status
             ORDER BY COUNT(Id) DESC
        ];
        Map<String, Integer> expectedCounts = getStackedResultCountMap(
            expectedResults, groupingProperty, subGroupingProperty, countProperty
        );

        // Assert that each expected count matches the actual count
        for (String grouping : expectedCounts.keySet()) {
            Assert.areEqual(
                expectedCounts.get(grouping), 
                resultCountMap.get(grouping), 
                'Mismatch in count for ' + grouping
            );
        }
    }

    /**
     * Test open case facility counts
     */
    @IsTest
    static void testGetOpenCaseFacilityCounts() {
        String groupingProperty = 'Facility';
        String countProperty = 'CaseCount';

        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getOpenCaseFacilityCounts();
        Test.stopTest();

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = getResultCountMap(
            aggregateResults, groupingProperty, countProperty
        );

        List<AggregateResult> expectedResults = [
            SELECT Facility__r.Name Facility, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false 
              WITH SYSTEM_MODE
             GROUP BY Facility__r.Name
             ORDER BY COUNT(Id) DESC
        ];
        Map<String, Integer> expectedCounts = getResultCountMap(
            expectedResults, groupingProperty, countProperty
        );

        // Assert that each expected count matches the actual count
        for (String grouping : expectedCounts.keySet()) {
            Assert.areEqual(
                expectedCounts.get(grouping), 
                resultCountMap.get(grouping), 
                'Mismatch in count for ' + grouping
            );
        }
    }

    /**
     * Test open case type counts
     */
    @IsTest
    static void testGetOpenCaseTypeCounts() {
        String groupingProperty = 'Type';
        String countProperty = 'CaseCount';

        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getOpenCaseTypeCounts();
        Test.stopTest();

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = getResultCountMap(
            aggregateResults, groupingProperty, countProperty
        );

        List<AggregateResult> expectedResults = [
            SELECT Type, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false
               AND CreatedDate = LAST_N_DAYS:30
              WITH SYSTEM_MODE
             GROUP BY Type
             ORDER BY COUNT(Id) DESC
        ];
        Map<String, Integer> expectedCounts = getResultCountMap(
            expectedResults, groupingProperty, countProperty
        );

        // Assert that each expected count matches the actual count
        for (String grouping : expectedCounts.keySet()) {
            Assert.areEqual(
                expectedCounts.get(grouping), 
                resultCountMap.get(grouping), 
                'Mismatch in count for ' + grouping
            );
        }
    }

    /**
     * Test closed cases last 30 days counts by owner
     */
    @IsTest
    static void testGetClosedCasesLastThirtyDays() {
        String groupingProperty = 'CaseOwner';
        String countProperty = 'CaseCount';

        Test.startTest();
        List<AggregateResult> aggregateResults = CasesDashboardController.getClosedCasesLastThirtyDays();
        Test.stopTest();

        // Convert AggregateResults to a map for easier checking
        Map<String, Integer> resultCountMap = getResultCountMap(
            aggregateResults, groupingProperty, countProperty
        );

        List<AggregateResult> expectedResults = [
            SELECT Owner.Name CaseOwner, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = true
               AND ClosedDate = LAST_N_DAYS:30
              WITH SYSTEM_MODE
             GROUP BY Owner.Name
             ORDER BY COUNT(Id) DESC
        ];
        Map<String, Integer> expectedCounts = getResultCountMap(
            expectedResults, groupingProperty, countProperty
        );

        // Assert that each expected count matches the actual count
        for (String grouping : expectedCounts.keySet()) {
            Assert.areEqual(
                expectedCounts.get(grouping), 
                resultCountMap.get(grouping), 
                'Mismatch in count for ' + grouping
            );
        }
    }

    /**
     * Test save as image
     */
    @IsTest
    static void testSaveAsImage() {
        String base64 = BASE64_STRING;
        String fileName = 'testImage';

        Test.startTest();
        String fileId = CasesDashboardController.saveAsImage(base64, fileName);
        Test.stopTest();

        Assert.isNotNull(fileId, 'The method should return the ID of the created ContentVersion.');
        
        ContentVersion cv = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Id = :fileId];
        Assert.areEqual(fileName, cv.Title, 'The ContentVersion should have the expected title.');
    }

    /**
     * Test save as image with exception
     */
    @IsTest
    static void testSaveAsImageWithException() {
        String invalidBase64 = 'not_a_valid_base64_string';
        String fileName = 'testImage';
        Boolean hasException = false;
        String exceptionMessage;

        Test.startTest();
        try {
            CasesDashboardController.saveAsImage(invalidBase64, fileName);
        } catch (Exception e) {
            hasException = true;
            exceptionMessage = e.getMessage();
        }
        Test.stopTest();

        Assert.isTrue(hasException, 'The method should throw an exception.');
    }

    /**************************************************
     * Utilities
     **************************************************/

    /**
     * @description Converts an AggregateResult of case record counts to a map for easier assertions.
     * @param {Array} aggregateResults
     * @param {String} groupProperty 
     * @param {String} countProperty
     */
    private static Map<String, Integer> getResultCountMap(
        List<AggregateResult> aggregateResults, 
        String groupProperty,
        String countProperty
    ) {
        Map<String, Integer> resultCountMap = new Map<String, Integer>();
        for (AggregateResult ar : aggregateResults) {
            String groupName = (String)ar.get(groupProperty);
            Integer count = (Integer)ar.get(countProperty);
            resultCountMap.put(groupName, count);
        }
        return resultCountMap;
    }

    /**
     * @description Converts an AggregateResult of case record counts to a map for easier assertions.
     *  Use this version for stacked data, where there is more than one level of aggregation
     * @param {Array} aggregateResults
     * @param {String} groupProperty 
     * @param {String} subGroupProperty 
     * @param {String} countProperty
     */
    private static Map<String, Integer> getStackedResultCountMap(
        List<AggregateResult> aggregateResults, 
        String groupProperty,
        String subGroupProperty,
        String countProperty
    ) {
        Map<String, Integer> resultCountMap = new Map<String, Integer>();
        for (AggregateResult ar : aggregateResults) {
            String groupName = (String)ar.get(groupProperty);
            String subGroupName = (String)ar.get(subGroupProperty);
            Integer count = (Integer)ar.get(countProperty);
            resultCountMap.put(groupName + '-' + subGroupName, count);
        }
        return resultCountMap;
    }
    
}