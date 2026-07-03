function buildMeetingCard(event) {
  var metadata = getMeetingMetadata(event);
  var existingMapping = getMeetingMapping(metadata.meetingId);
  var suggestedRecords = getSuggestedCRMRecords(metadata.customerDomains);
  
  // If no suggestions, show all records
  var crmRecords = suggestedRecords.length > 0 ? suggestedRecords : getAllCRMRecords();

  var card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle("CRM Meeting Mapping")
  );

  // Status Section - Show if already mapped
  if (existingMapping) {
    var statusSection = CardService.newCardSection().setHeader("ASSOCIATION STATUS");
    var record = existingMapping.crmRecord;
    
    statusSection.addWidget(
      CardService.newDecoratedText()
        .setTopLabel("Connected to " + record.type)
        .setText(record.title)
        .setBottomLabel("Company: " + record.company)
        .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.CONFIRMATION_NUMBER_ICON))
    );
    card.addSection(statusSection);
  }

  var meetingSection = CardService.newCardSection().setHeader(
    "Meeting Information"
  );
  meetingSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel("Meeting Title")
      .setContent(metadata.title || "-")
  );
  meetingSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel("Meeting ID")
      .setContent(metadata.meetingId || "-")
  );
  meetingSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel("Meeting Host")
      .setContent(metadata.meetingHost || "-")
  );
  card.addSection(meetingSection);

  var companiesSection = CardService.newCardSection().setHeader(
    "Detected Companies"
  );
  if (!metadata.customerDomains.length) {
    companiesSection.addWidget(
      CardService.newTextParagraph().setText("No external customer domains detected.")
    );
  } else {
    metadata.customerDomains.forEach(function (domain) {
      var companyName = getCompanyName(domain) || "Unknown Company";
      companiesSection.addWidget(
        CardService.newKeyValue()
          .setTopLabel(companyName)
          .setContent(domain)
      );
    });
  }
  card.addSection(companiesSection);

  var associateSection = CardService.newCardSection().setHeader(
    existingMapping ? "Update Association" : (suggestedRecords.length > 0 ? "Associate Meeting (Suggested)" : "Associate Meeting (All Records)")
  );

  if (crmRecords.length === 0) {
    associateSection.addWidget(
      CardService.newTextParagraph().setText("No CRM records found.")
    );
  } else {
    var dropdown = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setFieldName("crmRecordSelection")
      .setTitle("Select CRM Record");

    crmRecords.forEach(function (record) {
      var optionLabel =
        record.type + " • " + record.title + " • " + record.company;
      
      // Pre-select if it matches existing - Ensure isSelected is explicitly a boolean
      var isSelected = !!(existingMapping && existingMapping.crmRecord && existingMapping.crmRecord.id === record.id);
      dropdown.addItem(optionLabel, JSON.stringify(record), isSelected);
    });

    associateSection.addWidget(dropdown);

    var action = CardService.newAction()
      .setFunctionName("saveMapping")
      .setParameters({
        meetingId: metadata.meetingId || "",
        meetingUuid: metadata.meetingUuid || "",
        calendarEventId: metadata.calendarEventId || "",
        meetingHost: metadata.meetingHost || "",
        zoomCreatorId: metadata.zoomCreatorId || "",
      });

    var saveButton = CardService.newTextButton()
      .setText(existingMapping ? "Update Mapping" : "Save Mapping")
      .setOnClickAction(action);

    associateSection.addWidget(
      CardService.newButtonSet().addButton(saveButton)
    );
  }

  card.addSection(associateSection);
  return card.build();
}

function saveMapping(e) {
  var selectedRecord = getSelectedCRMRecord_(e);

  if (!selectedRecord) {
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification().setText("Please select a CRM record.")
      )
      .build();
  }

  var params = (e && e.parameters) || {};

  var mapping = {
    meetingId: params.meetingId || "",
    meetingUuid: params.meetingUuid || "",
    calendarEventId: params.calendarEventId || "",
    meetingHost: params.meetingHost || "",
    zoomCreatorId: params.zoomCreatorId || "",
    crmRecord: selectedRecord,
    createdAt: new Date().toISOString(),
  };

  saveMeetingMapping(mapping);

  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText("Meeting successfully mapped.")
    )
    .build();
}

function getSelectedCRMRecord_(e) {
  var formInputs =
    e && e.commonEventObject && e.commonEventObject.formInputs
      ? e.commonEventObject.formInputs
      : null;

  if (!formInputs || !formInputs.crmRecordSelection) {
    return null;
  }

  var input = formInputs.crmRecordSelection;
  var values =
    input.stringInputs && input.stringInputs.value ? input.stringInputs.value : [];

  if (!values.length) {
    return null;
  }

  try {
    return JSON.parse(values[0]);
  } catch (err) {
    Logger.log("Failed to parse selected CRM record: %s", err.message);
    return null;
  }
}
