public without sharing class CasesDashboardController {
    
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
    public static List<AggregateResult> getOpenCaseOwnerCounts() {
        return [
            SELECT Owner.Name CaseOwner, Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false
              WITH SYSTEM_MODE
             GROUP BY Owner.Name, Status
             ORDER BY COUNT(Id) DESC
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

    @AuraEnabled
    public static String saveAsImage(
        String base64,
        String fileName
    ) {
        try {
            ContentVersion cv = new ContentVersion();
            cv.VersionData = EncodingUtil.base64Decode(base64);
            cv.Title = filename;
            cv.PathOnClient = filename + '.png';
      
            insert cv;
            return String.valueOf(cv.Id);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}