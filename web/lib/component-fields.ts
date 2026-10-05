// Which text fields the form shows for each component.
// `name` is the label people see; `ruleName` is the component name the
// style guide uses, so Claude knows which rules apply to that part.

export type PartDefinition = {
  name: string;
  ruleName: string;
};

const titleAndDescription = (prefix: string): PartDefinition[] => [
  { name: "Title", ruleName: `${prefix}Title` },
  { name: "Description", ruleName: `${prefix}Description` },
];

const multiPart: Record<string, PartDefinition[]> = {
  Alert: titleAndDescription("Alert"),
  Card: titleAndDescription("Card"),
  Dialog: titleAndDescription("Dialog"),
  Empty: titleAndDescription("Empty"),
  Page: titleAndDescription("Page"),
  Toast: titleAndDescription("Toast"),
  Field: [
    { name: "Label", ruleName: "FieldLabel" },
    { name: "Help text", ruleName: "FieldDescription" },
    { name: "Error text", ruleName: "FieldError" },
  ],
};

const singlePartLabels: Record<string, string> = {
  Badge: "Badge text",
  Button: "Button label",
  FieldError: "Error message",
  FieldLabel: "Label",
  Label: "Label",
  Link: "Link text",
  ProgressLabel: "Progress message",
};

export function partsFor(component: string): PartDefinition[] {
  if (multiPart[component]) return multiPart[component];

  let name = singlePartLabels[component] ?? "Text";
  if (!singlePartLabels[component]) {
    if (component.endsWith("Title")) name = "Title";
    else if (component.endsWith("Description")) name = "Description";
  }
  return [{ name, ruleName: component }];
}
