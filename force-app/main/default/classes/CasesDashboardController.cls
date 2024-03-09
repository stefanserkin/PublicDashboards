public with sharing class CasesDashboardController {
    
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getOpenCaseStatusCounts() {
        return [
            SELECT Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false
              WITH SYSTEM_MODE
             GROUP BY Status
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getClosedCasesLastThirtyDays() {
        return [
            SELECT Owner.Name CaseOwner, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = true
               AND ClosedDate = LAST_N_DAYS:30
              WITH SYSTEM_MODE
             GROUP BY Owner.Name
             ORDER BY COUNT(Id) DESC
        ];
    }

}