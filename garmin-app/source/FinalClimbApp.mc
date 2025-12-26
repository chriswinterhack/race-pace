using Toybox.Application;
using Toybox.WatchUi;
using Toybox.System;

//! Main application class for FinalClimb
class FinalClimbApp extends Application.AppBase {
    //! Storage for race plan data
    var racePlan;
    var syncCode;

    //! Constructor
    function initialize() {
        AppBase.initialize();
        racePlan = null;
        syncCode = null;
    }

    //! Called on start of application
    function onStart(state) {
        // Load any cached race plan from storage
        loadCachedPlan();
    }

    //! Called when application stops
    function onStop(state) {
        // Save current plan to storage for next launch
        savePlanToCache();
    }

    //! Return the initial view
    function getInitialView() {
        if (racePlan != null) {
            // Show the race plan view
            return [new RacePlanView(), new RacePlanDelegate()];
        } else {
            // Show the sync code entry view
            return [new SyncCodeView(), new SyncCodeDelegate()];
        }
    }

    //! Load cached plan from application storage
    function loadCachedPlan() {
        try {
            var storage = Application.Storage;
            racePlan = storage.getValue("racePlan");
            syncCode = storage.getValue("syncCode");
        } catch (ex) {
            System.println("Error loading cached plan: " + ex.getErrorMessage());
        }
    }

    //! Save current plan to application storage
    function savePlanToCache() {
        try {
            var storage = Application.Storage;
            if (racePlan != null) {
                storage.setValue("racePlan", racePlan);
            }
            if (syncCode != null) {
                storage.setValue("syncCode", syncCode);
            }
        } catch (ex) {
            System.println("Error saving plan to cache: " + ex.getErrorMessage());
        }
    }

    //! Get the stored race plan
    function getRacePlan() {
        return racePlan;
    }

    //! Set the race plan (called after successful sync)
    function setRacePlan(plan, code) {
        racePlan = plan;
        syncCode = code;
        savePlanToCache();
    }

    //! Clear the stored race plan
    function clearRacePlan() {
        racePlan = null;
        syncCode = null;
        var storage = Application.Storage;
        storage.deleteValue("racePlan");
        storage.deleteValue("syncCode");
    }
}
