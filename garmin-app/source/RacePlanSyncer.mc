using Toybox.Communications;
using Toybox.System;
using Toybox.WatchUi;
using Toybox.Application;

//! Handles syncing race plan data from the RacePace API
class RacePlanSyncer {
    var syncView;
    var syncCode;

    //! Constructor
    function initialize(view) {
        syncView = view;
    }

    //! Fetch the race plan from the API
    function fetchPlan(code) {
        syncCode = code;

        // Build the API URL
        var url = "https://thefinalclimb.com/api/garmin/sync/" + code;

        var options = {
            :method => Communications.HTTP_REQUEST_METHOD_GET,
            :headers => {
                "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON
            },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };

        // Make the request
        Communications.makeWebRequest(
            url,
            null,
            options,
            method(:onReceive)
        );
    }

    //! Handle API response
    function onReceive(responseCode, data) {
        syncView.setLoading(false);

        if (responseCode == 200 && data != null) {
            // Success - parse and store the race plan
            var planData = data.get("data");

            if (planData != null) {
                // Store in application
                var app = Application.getApp();
                app.setRacePlan(planData, syncCode);

                // Show success and navigate to plan view
                syncView.setStatus("Plan synced successfully!");

                // Navigate to the race plan view
                WatchUi.switchToView(
                    new RacePlanView(),
                    new RacePlanDelegate(),
                    WatchUi.SLIDE_LEFT
                );
            } else {
                syncView.setStatus("Error: Invalid response");
            }
        } else if (responseCode == 404) {
            syncView.setStatus("Invalid sync code.\nCheck code and try again.");
        } else if (responseCode == 410) {
            // Gone - code expired or deactivated
            var errorMsg = "Code expired or inactive.";
            if (data != null && data.get("error") != null) {
                errorMsg = data.get("error");
            }
            syncView.setStatus(errorMsg);
        } else if (responseCode == -104) {
            // No connection
            syncView.setStatus("No internet connection.\nConnect phone and retry.");
        } else {
            // Other error
            var errorMsg = "Sync failed (Error " + responseCode + ")";
            syncView.setStatus(errorMsg);
        }
    }
}
