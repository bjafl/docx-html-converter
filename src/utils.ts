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
      console.log("innerMatch:", innerMatch);
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
      if (alwaysSkip.some((prefix) => propertyName.includes(prefix)))
        continue;

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
    table.style.width = "160mm" //Math.min(parentWidth || 0, wrapperWidth) + "px";
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
}
