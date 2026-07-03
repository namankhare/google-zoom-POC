var MAPPING_KEY_PREFIX = "MEETING_MAPPING_";

function saveMeetingMapping(mapping) {
  if (!mapping || !mapping.meetingId) {
    throw new Error("meetingId is required to save mapping.");
  }

  var key = getMeetingMappingKey_(mapping.meetingId);
  PropertiesService.getScriptProperties().setProperty(
    key,
    JSON.stringify(mapping)
  );

  return mapping;
}

function getMeetingMapping(meetingId) {
  if (!meetingId) {
    return null;
  }

  var raw = PropertiesService.getScriptProperties().getProperty(
    getMeetingMappingKey_(meetingId)
  );

  return raw ? JSON.parse(raw) : null;
}

function deleteMeetingMapping(meetingId) {
  if (!meetingId) {
    return;
  }

  PropertiesService.getScriptProperties().deleteProperty(
    getMeetingMappingKey_(meetingId)
  );
}

function getAllMeetingMappings() {
  var properties = PropertiesService.getScriptProperties().getProperties();
  var mappings = [];

  Object.keys(properties).forEach(function (key) {
    if (key.indexOf(MAPPING_KEY_PREFIX) !== 0) {
      return;
    }

    try {
      mappings.push(JSON.parse(properties[key]));
    } catch (err) {
      Logger.log("Skipping invalid mapping for key %s: %s", key, err.message);
    }
  });

  return mappings;
}

function getMeetingMappingKey_(meetingId) {
  return MAPPING_KEY_PREFIX + String(meetingId);
}
