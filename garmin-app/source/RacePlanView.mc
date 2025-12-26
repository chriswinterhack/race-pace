using Toybox.WatchUi;
using Toybox.Graphics;
using Toybox.Application;
using Toybox.System;

//! View for displaying the race plan with multiple pages
class RacePlanView extends WatchUi.View {
    //! Current page being displayed
    enum {
        PAGE_OVERVIEW,
        PAGE_POWER,
        PAGE_CHECKPOINTS
    }

    var currentPage;
    var racePlan;
    var checkpointIndex;
    var totalCheckpoints;

    //! Constructor
    function initialize() {
        View.initialize();
        currentPage = PAGE_OVERVIEW;
        checkpointIndex = 0;
        loadPlan();
    }

    //! Load the race plan from app storage
    function loadPlan() {
        var app = Application.getApp();
        racePlan = app.getRacePlan();
        if (racePlan != null) {
            var checkpoints = racePlan.get("checkpoints");
            totalCheckpoints = (checkpoints != null) ? checkpoints.size() : 0;
        } else {
            totalCheckpoints = 0;
        }
    }

    //! Called when view is shown
    function onShow() {
        loadPlan();
    }

    //! Draw the view
    function onUpdate(dc) {
        var width = dc.getWidth();
        var height = dc.getHeight();

        // Clear background
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();

        if (racePlan == null) {
            drawNoDataMessage(dc, width, height);
            return;
        }

        switch (currentPage) {
            case PAGE_OVERVIEW:
                drawOverviewPage(dc, width, height);
                break;
            case PAGE_POWER:
                drawPowerPage(dc, width, height);
                break;
            case PAGE_CHECKPOINTS:
                drawCheckpointPage(dc, width, height);
                break;
        }

        // Draw page indicator at bottom
        drawPageIndicator(dc, width, height);
    }

    //! Draw "no data" message
    function drawNoDataMessage(dc, width, height) {
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height / 2,
            Graphics.FONT_MEDIUM,
            "No race plan\nloaded",
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER
        );
    }

    //! Draw overview page with race name and goal
    function drawOverviewPage(dc, width, height) {
        var race = racePlan.get("race");
        var goal = racePlan.get("goal");
        var miles = racePlan.get("miles");
        var athlete = racePlan.get("athlete");

        // Title
        dc.setColor(Graphics.COLOR_BLUE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.08,
            Graphics.FONT_XTINY,
            "RACE PLAN",
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Race name (wrapped if needed)
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.25,
            Graphics.FONT_MEDIUM,
            race != null ? race : "Unknown Race",
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Distance
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        if (miles != null) {
            dc.drawText(
                width / 2,
                height * 0.42,
                Graphics.FONT_SMALL,
                miles.format("%.1f") + " miles",
                Graphics.TEXT_JUSTIFY_CENTER
            );
        }

        // Goal time (highlighted)
        if (goal != null) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_DK_GRAY);
            dc.fillRoundedRectangle(
                width * 0.15,
                height * 0.52,
                width * 0.7,
                height * 0.18,
                8
            );

            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.55,
                Graphics.FONT_XTINY,
                "GOAL",
                Graphics.TEXT_JUSTIFY_CENTER
            );
            dc.drawText(
                width / 2,
                height * 0.66,
                Graphics.FONT_MEDIUM,
                goal,
                Graphics.TEXT_JUSTIFY_CENTER
            );
        }

        // Athlete name
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.82,
            Graphics.FONT_XTINY,
            athlete != null ? athlete : "",
            Graphics.TEXT_JUSTIFY_CENTER
        );
    }

    //! Draw power targets page
    function drawPowerPage(dc, width, height) {
        var power = racePlan.get("power");

        // Title
        dc.setColor(Graphics.COLOR_YELLOW, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.08,
            Graphics.FONT_XTINY,
            "POWER TARGETS",
            Graphics.TEXT_JUSTIFY_CENTER
        );

        if (power == null) {
            dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.5,
                Graphics.FONT_SMALL,
                "No power data\navailable",
                Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER
            );
            return;
        }

        // FTP info
        var ftp = power.get("ftp");
        var adj = power.get("adj");
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.18,
            Graphics.FONT_XTINY,
            "FTP: " + ftp + "w  Adj: " + adj + "w",
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Race NP targets
        var safe = power.get("safe");
        var tempo = power.get("tempo");
        var push = power.get("push");

        var rowHeight = height * 0.14;
        var startY = height * 0.30;

        // Safe row
        drawPowerRow(dc, width, startY, "SAFE", safe, Graphics.COLOR_GREEN);

        // Tempo row
        drawPowerRow(dc, width, startY + rowHeight, "TEMPO", tempo, Graphics.COLOR_YELLOW);

        // Push row
        drawPowerRow(dc, width, startY + rowHeight * 2, "PUSH", push, Graphics.COLOR_RED);

        // Terrain powers
        var climbSafe = power.get("climbSafe");
        var flatSafe = power.get("flatSafe");

        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.78,
            Graphics.FONT_XTINY,
            "Climb: " + climbSafe + "w  Flat: " + flatSafe + "w",
            Graphics.TEXT_JUSTIFY_CENTER
        );
    }

    //! Draw a single power row
    function drawPowerRow(dc, width, y, label, watts, color) {
        // Label
        dc.setColor(color, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width * 0.25,
            y,
            Graphics.FONT_SMALL,
            label,
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Watts
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width * 0.70,
            y,
            Graphics.FONT_MEDIUM,
            watts + "w",
            Graphics.TEXT_JUSTIFY_CENTER
        );
    }

    //! Draw checkpoint page (paginated)
    function drawCheckpointPage(dc, width, height) {
        var checkpoints = racePlan.get("checkpoints");

        // Title with checkpoint number
        dc.setColor(Graphics.COLOR_BLUE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.08,
            Graphics.FONT_XTINY,
            "CHECKPOINT " + (checkpointIndex + 1) + "/" + totalCheckpoints,
            Graphics.TEXT_JUSTIFY_CENTER
        );

        if (checkpoints == null || checkpoints.size() == 0) {
            dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.5,
                Graphics.FONT_SMALL,
                "No checkpoints",
                Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER
            );
            return;
        }

        var checkpoint = checkpoints[checkpointIndex];
        var name = checkpoint.get("name");
        var mile = checkpoint.get("mi");
        var time = checkpoint.get("time");
        var effort = checkpoint.get("effort");

        // Checkpoint name
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.25,
            Graphics.FONT_MEDIUM,
            name != null ? name : "Checkpoint",
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Mile marker
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        if (mile != null) {
            dc.drawText(
                width / 2,
                height * 0.40,
                Graphics.FONT_SMALL,
                "Mile " + mile.format("%.1f"),
                Graphics.TEXT_JUSTIFY_CENTER
            );
        }

        // Target time (highlighted)
        if (time != null) {
            dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_DK_GRAY);
            dc.fillRoundedRectangle(
                width * 0.15,
                height * 0.50,
                width * 0.7,
                height * 0.18,
                8
            );

            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.53,
                Graphics.FONT_XTINY,
                "TARGET",
                Graphics.TEXT_JUSTIFY_CENTER
            );
            dc.drawText(
                width / 2,
                height * 0.64,
                Graphics.FONT_MEDIUM,
                time,
                Graphics.TEXT_JUSTIFY_CENTER
            );
        }

        // Effort level badge
        if (effort != null) {
            var effortColor = Graphics.COLOR_WHITE;
            if (effort.equals("safe")) {
                effortColor = Graphics.COLOR_GREEN;
            } else if (effort.equals("tempo")) {
                effortColor = Graphics.COLOR_YELLOW;
            } else if (effort.equals("pushing")) {
                effortColor = Graphics.COLOR_RED;
            }

            dc.setColor(effortColor, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.78,
                Graphics.FONT_SMALL,
                effort.toUpper(),
                Graphics.TEXT_JUSTIFY_CENTER
            );
        }
    }

    //! Draw page indicator dots at bottom
    function drawPageIndicator(dc, width, height) {
        var totalPages = 3;
        var dotRadius = 4;
        var dotSpacing = 14;
        var startX = width / 2 - (totalPages - 1) * dotSpacing / 2;
        var y = height * 0.94;

        for (var i = 0; i < totalPages; i++) {
            if (i == currentPage) {
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_WHITE);
            } else {
                dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_DK_GRAY);
            }
            dc.fillCircle(startX + i * dotSpacing, y, dotRadius);
        }
    }

    //! Navigate to next page
    function nextPage() {
        if (currentPage == PAGE_CHECKPOINTS) {
            // Cycle through checkpoints
            if (checkpointIndex < totalCheckpoints - 1) {
                checkpointIndex++;
            } else {
                // Go back to first page
                currentPage = PAGE_OVERVIEW;
                checkpointIndex = 0;
            }
        } else {
            currentPage++;
        }
        WatchUi.requestUpdate();
    }

    //! Navigate to previous page
    function previousPage() {
        if (currentPage == PAGE_CHECKPOINTS && checkpointIndex > 0) {
            checkpointIndex--;
        } else if (currentPage > PAGE_OVERVIEW) {
            currentPage--;
            if (currentPage == PAGE_CHECKPOINTS) {
                checkpointIndex = totalCheckpoints - 1;
            }
        } else {
            // Wrap to last checkpoint
            currentPage = PAGE_CHECKPOINTS;
            checkpointIndex = totalCheckpoints - 1;
        }
        WatchUi.requestUpdate();
    }
}

//! Input delegate for race plan view
class RacePlanDelegate extends WatchUi.BehaviorDelegate {
    var view;

    //! Constructor
    function initialize() {
        BehaviorDelegate.initialize();
    }

    //! Set view reference
    function setView(v) {
        view = v;
    }

    //! Handle next page (swipe down / button)
    function onNextPage() {
        var currentView = WatchUi.getCurrentView()[0];
        if (currentView instanceof RacePlanView) {
            currentView.nextPage();
        }
        return true;
    }

    //! Handle previous page (swipe up / button)
    function onPreviousPage() {
        var currentView = WatchUi.getCurrentView()[0];
        if (currentView instanceof RacePlanView) {
            currentView.previousPage();
        }
        return true;
    }

    //! Handle select - show menu for options
    function onSelect() {
        var menu = new WatchUi.Menu2({:title => "Options"});
        menu.addItem(new WatchUi.MenuItem("Resync Plan", null, :resync, null));
        menu.addItem(new WatchUi.MenuItem("New Code", null, :newCode, null));
        menu.addItem(new WatchUi.MenuItem("Clear Plan", null, :clear, null));

        WatchUi.pushView(menu, new PlanMenuDelegate(), WatchUi.SLIDE_UP);
        return true;
    }

    //! Handle back - exit app
    function onBack() {
        WatchUi.popView(WatchUi.SLIDE_RIGHT);
        return true;
    }
}

//! Menu delegate for plan options
class PlanMenuDelegate extends WatchUi.Menu2InputDelegate {
    function initialize() {
        Menu2InputDelegate.initialize();
    }

    function onSelect(item) {
        var id = item.getId();

        if (id == :resync) {
            // Re-fetch the current plan
            var app = Application.getApp();
            var code = app.syncCode;
            if (code != null) {
                WatchUi.popView(WatchUi.SLIDE_DOWN);
                // Show loading and resync
                var syncer = new RacePlanSyncer(null);
                syncer.fetchPlan(code);
            }
        } else if (id == :newCode) {
            // Go back to sync code entry
            var app = Application.getApp();
            app.clearRacePlan();
            WatchUi.switchToView(
                new SyncCodeView(),
                new SyncCodeDelegate(),
                WatchUi.SLIDE_RIGHT
            );
        } else if (id == :clear) {
            // Clear the plan
            var app = Application.getApp();
            app.clearRacePlan();
            WatchUi.switchToView(
                new SyncCodeView(),
                new SyncCodeDelegate(),
                WatchUi.SLIDE_RIGHT
            );
        }
    }
}
