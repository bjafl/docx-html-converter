import { addImportantToStylesMatching } from "./constants";

export function replaceTemplateCodes(
  html: string,
  templateCodes: Record<string, string>
): string {
  let modifiedHtml = html;
  const templateCodeMatches = html.match(/{[^}]+?}/g);
  if (Array.isArray(templateCodeMatches)) {
    const tableMatches: string[] = [];
    Array.from(templateCodeMatches).forEach((match) => {
      const inner = match.replace(/<[^>]+?>/g, "").replace(/[\s{}]+/g, "");
      if (inner.startsWith("#")) {
        tableMatches.push(match);
      } else if (inner in templateCodes) {
        const value = templateCodes[inner] || "??";
        const innerRemoved =
          match.match(/<[^>]+?>/g)?.reduce((acc, str) => acc + str, "") || "";
        const new_val = value + innerRemoved;
        modifiedHtml = modifiedHtml.replace(match, new_val);
      }
    });
    tableMatches.forEach((match) => {
      const inner = match.replace(/<[^>]+?>/g, "").replace(/[\s{}]+/g, "");
      if (inner in templateCodes) {
        const value = templateCodes[inner] || "??";
        modifiedHtml = modifiedHtml.replace(match, value);
      }
    });
  }
  return modifiedHtml;
}

export function replaceTemplateCodes2(
  element: Element,
  templateCodes: Record<string, string>
) {
  Array.from(element.children).forEach((child) => {
    replaceTemplateCodes2(child, templateCodes);
  });

  const tblCodesProcessed = new Array<string>();
  const tableCodeMatches = element.textContent?.match(/{#[^}]+?}/g);
  Array.from(tableCodeMatches || []).forEach((match) => {
    if (tblCodesProcessed.some((code) => match.startsWith(code))) {
      return;
    }
    let parent: HTMLElement | null | undefined = element.parentElement;
    while (parent && !(parent instanceof HTMLTableElement)) {
      parent = parent?.parentElement;
    }
    const parentTbl = parent instanceof HTMLTableElement ? parent : null;
    if (parentTbl) {
      const codeMatch = /{(#[^}]+?Tabell)}/g.exec(
        parentTbl.textContent || ""
      )?.[1];
      //if (!codeMatch) console.warn("No match found for table code:", match);

      const replaceCode = codeMatch ? templateCodes[codeMatch] : "????";
      const newElement = document.createElement("p");
      newElement.textContent = replaceCode;
      const parent = parentTbl.parentElement;
      if (parent) {
        parent.insertBefore(newElement, parentTbl);
        parent.removeChild(parentTbl);
        tblCodesProcessed.push(/#.+?-/g.exec(match)?.[0] || "");
      }
    } else {
      console.warn("No table found for match:", match);
      element.textContent = element.textContent?.replace(match, "????") || null;
    }
  });

  const codeMatches = element.textContent?.match(/{[^#}][^}]*?}/g);
  Array.from(codeMatches || []).forEach((match) => {
    const inner = match.replace(/[\s{}]+/g, "");
    if (inner in templateCodes) {
      const value = templateCodes[inner] || "????";
      const innerHtml = element.innerHTML;
      const innerMatch = innerHtml.match(/{[^}]+?}/g)?.[0] || "";
      const innerTextRemoved =
        innerMatch.match(/<[^>]+?>/g)?.reduce((acc, str) => acc + str, "") ||
        "";
      const new_val = value + innerTextRemoved;
      //element.textContent = element.textContent?.replace(match, value) || "????";
      element.innerHTML = innerHtml.replace(innerMatch, new_val);
    }
  });
}

export function applyComputedStylesToInline(
  rootElement: HTMLElement,
  excludeProps: string[] = []
) {
  // Process one element
  function processElement(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element);

    // Convert to inline styles
    for (let i = 0; i < computedStyle.length; i++) {
      const propertyName = computedStyle[i];

      if (excludeProps.includes(propertyName)) continue;
      // Skip properties that start with "-" (browser-specific)
      if (propertyName.startsWith("-")) continue;

      const propertyValue = computedStyle.getPropertyValue(propertyName);
      element.style.setProperty(propertyName, propertyValue);
    }

    // Process all child elements
    Array.from(element.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        processElement(child);
      }
    });
  }

  processElement(rootElement);
  return rootElement;
}

export function applyNonDefaultStylesToInline(
  rootElement: HTMLElement,
  excludeProps: string[] = []
) {
  // Common properties to always skip (add more as needed)
  const alwaysSkip = [
    "animation",
    "transition",
    "-webkit-",
    "-moz-",
    "-ms-",
    "-o-",
    "-inline-",
    "-block-",
    "perspective",
    "transform-origin",
  ];

  // Create a map to cache default styles for each tag type
  const defaultStylesCache = new Map();

  // Get default styles for a given tag name
  function getDefaultStyles(tagName: string) {
    if (defaultStylesCache.has(tagName)) {
      return defaultStylesCache.get(tagName);
    }

    // Create a temporary element with the same tag to get default styles
    const tempElement = document.createElement(tagName);
    document.body.appendChild(tempElement);
    const defaultStyles = window.getComputedStyle(tempElement);
    const styleMap: Record<string, string> = {};

    // Store all default styles
    for (let i = 0; i < defaultStyles.length; i++) {
      const prop = defaultStyles[i];
      styleMap[prop] = defaultStyles.getPropertyValue(prop);
    }

    // Clean up
    document.body.removeChild(tempElement);
    defaultStylesCache.set(tagName, styleMap);
    return styleMap;
  }

  // Process one element
  function processElement(element: HTMLElement) {
    const tagName = element.tagName.toLowerCase();
    const defaultStyles = getDefaultStyles(tagName);
    const computedStyle = window.getComputedStyle(element);

    // Convert to inline styles (only non-default ones)
    for (let i = 0; i < computedStyle.length; i++) {
      const propertyName = computedStyle[i];

      // Skip excluded or always-skip properties
      if (excludeProps.includes(propertyName)) continue;
      if (alwaysSkip.some((prefix) => propertyName.includes(prefix))) continue;

      const computedValue = computedStyle.getPropertyValue(propertyName);
      const defaultValue = defaultStyles[propertyName];

      // Only apply if different from default
      if (computedValue !== defaultValue) {
        element.style.setProperty(propertyName, computedValue);
      }
    }

    // Process all child elements
    Array.from(element.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        processElement(child);
      }
    });
  }

  // Start the recursive processing
  processElement(rootElement);
  return rootElement;
}

export function allTablesFullWidth(rootElement: HTMLElement) {
  const tables = rootElement.querySelectorAll("table");
  //const wrapperWidth = (rootElement.querySelector(".A4-wrapper") as HTMLElement)?.clientWidth;
  tables.forEach((table) => {
    if (table.className.includes("A4-wrapper")) return;
    //const parentWidth = table.parentElement?.clientWidth;
    table.style.width = "100%"; //"160mm" //Math.min(parentWidth || 0, wrapperWidth) + "px";
    /*const existingWidth = /width:[^;](;|$)/.exec(table.style.cssText);
    if (existingWidth) {
      table.style.cssText = table.style.cssText.replace(
        existingWidth[0],
        p
      );
    } else {
      table.style.cssText += "width:100%;";
    }*/
  });
}

export function wrapPageInTbl(rootElement: HTMLElement) {
  const tbl = document.createElement("table");
  tbl.style.cssText =
    "border-width:0px !important; margin:auto; padding:0px; width:160mm;";
  tbl.className = "A4-wrapper";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.style.cssText = "border-width:0px !important;";
  tr.appendChild(td);
  tbl.appendChild(tr);
  Array.from(rootElement.children).forEach((child) => {
    td.appendChild(child);
  });
  rootElement.innerHTML = "";
  rootElement.appendChild(tbl);
  return tbl;
}

export function removeFontFamily(rootElement: HTMLElement, setInRoot = true) {
  const fontFamilyCount: Record<string, number> = {};

  const removeFontsChildren = (firstChild: HTMLElement) => {
    firstChild.childNodes.forEach((child) => {
      if (child instanceof HTMLElement) removeFontsChildren(child);
    });

    const fFamily = firstChild.style.fontFamily;
    fFamily.split(",").forEach((fam) => {
      fam = fam.replace(/(^['" ]+)|(['" ]+$)/g, "").trim();
      fontFamilyCount[fam] = (fontFamilyCount[fam] || 1) + 1;
    });
    firstChild.style.fontFamily = "";
  };

  removeFontsChildren(rootElement);

  if (setInRoot) {
    console.log("font counts", fontFamilyCount);
    const [newFam] = Object.entries(fontFamilyCount).reduce(
      (last, cur) => {
        return last[1] >= cur[1] ? last : cur;
      },
      ["", 0]
    );
    if (newFam) {
      rootElement.style.fontFamily = newFam;
    }
  }
}

export function applyStyleheetsInline(
  doc: Document,
  excludeProps: string[] = []
) {
  Array.from(doc.styleSheets).forEach((styleSheet) => {
    try {
      const rules = styleSheet.cssRules || [];
      Array.from(rules).forEach((rule) => {
        if (rule.constructor.name === "CSSStyleRule") {
          const styleRule = rule as CSSStyleRule;
          const styleProps = Array.from(styleRule.style);

          const style = styleProps
            .filter((propName) => !excludeProps.includes(propName))
            .map((propName) => ({
              [propName]: styleRule.style.getPropertyValue(propName),
            }))
            .reduce(
              (acc, cur) => ({ ...acc, ...cur }),
              {} as Record<string, string>
            );
          const elements = doc.querySelectorAll(styleRule.selectorText);
          elements.forEach((element) => {
            if (element.nodeType === Node.ELEMENT_NODE) {
              applyStylesInlineToElement(element as HTMLElement, style, false, true, doc);
            }
          });
        }
      });
    } catch (e) {
      console.warn("Error applying styles from stylesheet:", e);
    }
  });
}

export function applyStylesInline(
  element: HTMLElement,
  styles: Record<string, Record<string, string>>,
  contextDoc: Document = document
) {
  Object.entries(styles).forEach(([selector, style]) => {
    const elements = element.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el.nodeType === Node.ELEMENT_NODE) {
        applyStylesInlineToElement(el as HTMLElement, style, false, true, contextDoc);
      }
    });
  });
}

export function combineStyles(styles: CSSStyleDeclaration[]) {
  const combinedStyles: Record<string, string> = {};
  styles.forEach((style) => {
    Array.from(style).forEach((prop) => {
      const value = style.getPropertyValue(prop);
      if (value) {
        combinedStyles[prop] = value;
      }
    });
  });
  return combinedStyles;
}

export function applyStylesInlineToElement(
  element: HTMLElement,
  styles: Record<string, string> | CSSStyleDeclaration,
  excludeExising = true,
  computeSpecialValues = true,
  computeContextDoc: Document = document
) {
  Object.entries(styles).forEach(([prop, value]) => {
    if (value) {
      if (excludeExising && element.style.getPropertyValue(prop)) return;
      const addImportant = value.includes("!important") || addImportantToStylesMatching.some((match) =>
        match.test(prop)
      );
      if (computeSpecialValues && /var|calc\(.+\)/i.test(value)) {
        const computedValue = computeStyleValue(prop, value, computeContextDoc);
        if (computedValue) {
          element.style.setProperty(prop, computedValue, addImportant ? "important" : "");
        } else {
          console.warn("Could not compute value for:", prop, value);
        }
      } else {
        element.style.setProperty(prop, value, addImportant ? "important" : "");
      }
    }
  });
}

/*function computeStyle(styles: Record<string, string> | CSSStyleDeclaration, contextDoc: Document = document) {
  const tempElement = contextDoc.createElement("div");
  contextDoc.body.appendChild(tempElement);
  applyStylesInlineToElement(tempElement, styles);
  const computedStyle = window.getComputedStyle(tempElement);
  const resolvedStyle: Record<string, string> = {};
  Object.keys(styles).forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop);
    if (value) {
      resolvedStyle[prop] = value;
    }
  });
  contextDoc.body.removeChild(tempElement);
  return resolvedStyle;
}*/

function computeStyleValue(prop: string, value: string, contextDoc: Document = document) {
  const tempElement = contextDoc.createElement("div");
  document.body.appendChild(tempElement);
  tempElement.style.setProperty(prop, value);
  const computedValue = window.getComputedStyle(tempElement).getPropertyValue(prop);
  document.body.removeChild(tempElement);
  return computedValue;
}

export function stripClassNames(element: HTMLElement) {
  if (element.attributes.getNamedItem("class")) {
    element.attributes.removeNamedItem("class");
  }
  Array.from(element.childNodes).forEach((child) => {
    if (child instanceof HTMLElement) stripClassNames(child);
  });
}
export function addImportantToInlineStyles(
  rootElement: HTMLElement
) {
  // Process this element's styles
  Array.from(rootElement.style).forEach((prop) => {
    if (addImportantToStylesMatching.some((match) => match.test(prop))) {
      const value = rootElement.style.getPropertyValue(prop);
      if (value) {
        rootElement.style.setProperty(prop, value, "important");
      }
    }
  });
  
  // Process ALL descendant elements
  const allDescendants = rootElement.querySelectorAll('*');
  allDescendants.forEach((descendant) => {
    if (descendant instanceof HTMLElement) {
      Array.from(descendant.style).forEach((prop) => {
        if (addImportantToStylesMatching.some((match) => match.test(prop))) {
          const value = descendant.style.getPropertyValue(prop);
          if (value) {
            descendant.style.setProperty(prop, value, "important");
          }
        }
      });
    }
  });
}