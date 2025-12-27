using Toybox.WatchUi;
using Toybox.Graphics;
using Toybox.System;

//! View for entering sync code
class SyncCodeView extends WatchUi.View {
    var syncCode;
    var statusMessage;
    var isLoading;

    //! Constructor
    function initialize() {
        View.initialize();
        syncCode = "";
        statusMessage = "Enter sync code from\nthefinalclimb.com";
        isLoading = false;
    }

    //! Load resources
    function onLayout(dc) {
        // No layout resources needed for this simple view
    }

    //! Called when the view is shown
    function onShow() {
        // Nothing needed
    }

    //! Draw the view
    function onUpdate(dc) {
        var width = dc.getWidth();
        var height = dc.getHeight();

        // Clear background
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();

        // Draw header
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.12,
            Graphics.FONT_SMALL,
            "FinalClimb",
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Draw current sync code (in a prominent box)
        var codeY = height * 0.35;
        var codeBoxHeight = height * 0.18;

        // Draw code background
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_DK_GRAY);
        dc.fillRoundedRectangle(
            width * 0.1,
            codeY - codeBoxHeight / 2,
            width * 0.8,
            codeBoxHeight,
            8
        );

        // Draw the code or placeholder
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        var displayCode = syncCode.length() > 0 ? syncCode : "FC-____-____";
        dc.drawText(
            width / 2,
            codeY,
            Graphics.FONT_MEDIUM,
            displayCode,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER
        );

        // Draw status message
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(
            width / 2,
            height * 0.58,
            Graphics.FONT_TINY,
            statusMessage,
            Graphics.TEXT_JUSTIFY_CENTER
        );

        // Draw loading indicator if syncing
        if (isLoading) {
            dc.setColor(Graphics.COLOR_BLUE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.78,
                Graphics.FONT_SMALL,
                "Syncing...",
                Graphics.TEXT_JUSTIFY_CENTER
            );
        } else {
            // Draw instructions
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(
                width / 2,
                height * 0.78,
                Graphics.FONT_TINY,
                "SELECT to edit code",
                Graphics.TEXT_JUSTIFY_CENTER
            );
        }
    }

    //! Hide the view
    function onHide() {
        // Nothing needed
    }

    //! Set the sync code
    function setSyncCode(code) {
        syncCode = code;
        WatchUi.requestUpdate();
    }

    //! Set status message
    function setStatus(message) {
        statusMessage = message;
        WatchUi.requestUpdate();
    }

    //! Set loading state
    function setLoading(loading) {
        isLoading = loading;
        WatchUi.requestUpdate();
    }

    //! Get current sync code
    function getSyncCode() {
        return syncCode;
    }
}

//! Input delegate for sync code view
class SyncCodeDelegate extends WatchUi.BehaviorDelegate {
    var view;

    //! Constructor
    function initialize() {
        BehaviorDelegate.initialize();
    }

    //! Set the associated view
    function setView(v) {
        view = v;
    }

    //! Handle select button press
    function onSelect() {
        // Show text picker for code entry
        var picker = new TextPickerDelegate(view);
        WatchUi.pushView(
            new WatchUi.TextPicker(""),
            picker,
            WatchUi.SLIDE_UP
        );
        return true;
    }

    //! Handle back button
    function onBack() {
        // Exit the app
        WatchUi.popView(WatchUi.SLIDE_RIGHT);
        return true;
    }
}

//! Delegate for text picker
class TextPickerDelegate extends WatchUi.TextPickerDelegate {
    var parentView;

    function initialize(view) {
        TextPickerDelegate.initialize();
        parentView = view;
    }

    //! Handle text entry completed
    function onTextEntered(text, changed) {
        if (changed && text != null && text.length() > 0) {
            // Format and validate the code
            var formattedCode = formatCode(text.toUpper());
            parentView.setSyncCode(formattedCode);

            // Start the sync process
            startSync(formattedCode);
        }
        return true;
    }

    //! Format code to FC-XXXX-XXXX pattern
    function formatCode(input) {
        // Strip any existing dashes or spaces
        var clean = "";
        for (var i = 0; i < input.length(); i++) {
            var c = input.substring(i, i + 1);
            if (!c.equals("-") && !c.equals(" ")) {
                clean = clean + c;
            }
        }

        // Add FC- prefix if missing
        if (!clean.substring(0, 2).equals("FC")) {
            clean = "FC" + clean;
        }

        // Format as FC-XXXX-XXXX
        if (clean.length() >= 10) {
            return clean.substring(0, 2) + "-" +
                   clean.substring(2, 6) + "-" +
                   clean.substring(6, 10);
        }

        return input;
    }

    //! Start sync with the API
    function startSync(code) {
        parentView.setLoading(true);
        parentView.setStatus("Connecting to FinalClimb...");

        // Make HTTP request to fetch race plan
        var syncer = new RacePlanSyncer(parentView);
        syncer.fetchPlan(code);
    }
}
