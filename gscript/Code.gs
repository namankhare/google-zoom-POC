function onHomepage() {
  return buildHomepage();
}

function buildHomepage() {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("CRM Meeting Mapping"))
    .addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText(
          "Open a Calendar meeting<br>to associate it with a CRM Lead or Deal."
        )
      )
    )
    .build();
}
