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

    private static Map<String, Public_Dashboard_Setting__mdt> mapDashboardSettings;

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

    /*********************************************
     * @description Check for active password protection for the calling component
     * @param lwcName Name of the component making the request
     * @return Boolean indicating if a password is required or not
     *********************************************/
    @AuraEnabled
    public static Boolean isPasswordProtected(
        String lwcName
    ) {
        return dashboardSettingsMap().containsKey(lwcName) && 
            String.isNotBlank(dashboardSettingsMap().get(lwcName).Password__c);
    }

    /*********************************************
     * @description For password-protected dashboards, ensure the user
     *  has the password configured in Public Dashboard Settings custom metadata.
     * @param lwcName Name of the component making the request
     * @param password Password configured in Public Dashboard Settings cmd
     * @return String 'Success' or exception message
     *********************************************/
    @AuraEnabled
    public static String authorizeSession(
        String lwcName,
        String password
    ) {
        try {
            String result;
            // Verify there is a setting for this component
            if (!dashboardSettingsMap().containsKey(lwcName)) {
                result = 'No public dashboard settings record found';
            } else {
                // Verify the password
                if (dashboardSettingsMap().get(lwcName).Password__c != password) {
                    result = 'Invalid Password';
                }
            }

            // Return result
            return result != null ? result : 'success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static Map<String, Public_Dashboard_Setting__mdt> dashboardSettingsMap() {
        if (mapDashboardSettings == null) {
            mapDashboardSettings = new Map<String, Public_Dashboard_Setting__mdt>();
            List<Public_Dashboard_Setting__mdt> lstSettings = Public_Dashboard_Setting__mdt.getAll().values();
            for (Public_Dashboard_Setting__mdt pds : lstSettings) {
                mapDashboardSettings.put(pds.LWC_Name__c, pds);
            }
        }
        return mapDashboardSettings;
    }

}