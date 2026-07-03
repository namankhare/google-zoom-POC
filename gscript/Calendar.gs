function onCalendarEventOpen(e) {
  var calendarId = e && e.calendar && e.calendar.calendarId;
  var eventId = e && e.calendar && e.calendar.id;

  if (!calendarId || !eventId) {
    return buildMeetingCard(null);
  }

  var event = Calendar.Events.get(calendarId, eventId, {
    conferenceDataVersion: 1,
  });

  return buildMeetingCard(event);
}

function getMeetingHost(event) {
  if (!event) {
    return "";
  }

  var notes =
    event.conferenceData && event.conferenceData.notes
      ? event.conferenceData.notes
      : "";

  if (notes) {
    // Strip HTML tags as Zoom notes often provide host as a linked email
    var cleanNotes = notes.replace(/<\/?[^>]+(>|$)/g, " ");
    var hostMatch = cleanNotes.match(/Meeting\s*host\s*:\s*([^\s]+)/i);
    if (hostMatch && hostMatch[1]) {
      return hostMatch[1].trim().toLowerCase();
    }
  }

  return (event.creator && event.creator.email
    ? event.creator.email
    : ""
  ).toLowerCase();
}

function getCustomerDomains(event) {
  if (!event) {
    return [];
  }

  var domainSet = {};
  var attendees = event.attendees || [];

  attendees.forEach(function (attendee) {
    var email = attendee && attendee.email ? attendee.email : "";
    var domain = extractDomainFromEmail_(email);
    if (domain && domain !== COMPANY_DOMAIN) {
      domainSet[domain] = true;
    }
  });

  var meetingHost = getMeetingHost(event);
  var hostDomain = extractDomainFromEmail_(meetingHost);
  if (hostDomain && hostDomain !== COMPANY_DOMAIN) {
    domainSet[hostDomain] = true;
  }

  return Object.keys(domainSet);
}

function getMeetingMetadata(event) {
  if (!event) {
    return {
      meetingId: "",
      meetingUuid: "",
      zoomCreatorId: "",
      calendarEventId: "",
      title: "",
      meetingHost: "",
      customerDomains: [],
    };
  }

  var zoomParams =
    event.conferenceData &&
    event.conferenceData.parameters &&
    event.conferenceData.parameters.addOnParameters &&
    event.conferenceData.parameters.addOnParameters.parameters
      ? event.conferenceData.parameters.addOnParameters.parameters
      : {};

  return {
    meetingId: zoomParams.meetingId || zoomParams.id || event.id || "",
    meetingUuid: zoomParams.meetingUuid || zoomParams.uuid || "",
    zoomCreatorId: zoomParams.zoomCreatorId || zoomParams.creatorId || "",
    calendarEventId: event.id || "",
    title: event.summary || "(Untitled Meeting)",
    meetingHost: getMeetingHost(event),
    customerDomains: getCustomerDomains(event),
  };
}

function extractDomainFromEmail_(email) {
  if (!email || email.indexOf("@") === -1) {
    return null;
  }

  return email.split("@").pop().trim().toLowerCase();
}
