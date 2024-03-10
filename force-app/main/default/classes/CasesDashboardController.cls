/*********************************************
 * @description Controller for the public dashboards around cases.
 *  Results are currently hard-coded to the Engineering record type.
 * 
 * IMPORTANT - Do not include other case record types in here without careful consideration 
 *            as this may return cases of record types that are not publicly available. 
 *            Only aggregate queries should be implemented in this class.
 * 
 * @date 2024
 *********************************************/
public without sharing class CasesDashboardController {

    /*********************************************
     * Queries
     *********************************************/
    
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
               AND Owner.Type = 'User'
              WITH SYSTEM_MODE
             GROUP BY Owner.Name, Status
             ORDER BY COUNT(Id) DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getOpenCasePriorityCounts() {
        return [
            SELECT Priority, Status, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false 
              WITH SYSTEM_MODE
             GROUP BY Priority, Status
             ORDER BY COUNT(Id) DESC
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getOpenCaseFacilityCounts() {
        return [
            SELECT Facility__r.Name Facility, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false 
              WITH SYSTEM_MODE
             GROUP BY Facility__r.Name
             ORDER BY COUNT(Id) DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getOpenCaseTypeCounts() {
        return [
            SELECT Type, COUNT(Id) CaseCount 
              FROM Case 
             WHERE RecordType.Name = 'Engineering' 
               AND IsClosed = false
               AND CreatedDate = LAST_N_DAYS:30
              WITH SYSTEM_MODE
             GROUP BY Type
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

    /*********************************************
     * @description Saves a base64 encoded image as a ContentVersion in Salesforce.
     * @param base64 Base64 encoded string of the image
     * @param fileName Name of the file to be saved
     * @return Id of the created ContentVersion record
     *********************************************/
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
      
            Database.insert(cv, AccessLevel.SYSTEM_MODE);
            return String.valueOf(cv.Id);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}