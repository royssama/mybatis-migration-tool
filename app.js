const SAMPLE_XML = `<isEqual property = "AA_TYPE" compareValue="s001" >
  AND AA_TYPE = #AA_TYPE#
</isEqual>

<isNotEqual property = "BB_FFF_CODE" compareValue="C001" >
  AND BB_FFF_CODE != #BB_FFF_CODE#
</isNotEqual>

<iterate property ="AAA_LIST" conjunction="" >
  <iterate property ="SUB_LIST" conjunction="," >
    ,NVL($SUB_LIST[].SUB_COL01$_$AAA_LIST[]$,0) as $SUB_LIST[].SUB_COL01$_$AAA_LIST[]$
  </iterate>
</iterate>`;

const CONDITIONAL_TAGS = new Map([
  ["isequal", { operator: "" }],
  ["isnotequal", { operator: "!" }],
]);

function toCamelCase(value) {
  const cleaned = String(value || "").trim();

  if (!cleaned) {
    return cleaned;
  }

  if (!cleaned.includes("_")) {
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  return cleaned
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) {
        return part;
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function parseAttributes(tagSource) {
  const attributes = {};
  const attributePattern = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;

  while ((match = attributePattern.exec(tagSource)) !== null) {
    attributes[match[1]] = match[3] ?? match[4] ?? "";
  }

  return attributes;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function convertHashParameter(parameterName) {
  if (parameterName.includes(".")) {
    return parameterName;
  }

  return toCamelCase(parameterName);
}

function convertDtoParameters(text, iterateStack) {
  const iterateCollections = new Set(iterateStack.map((context) => context.collection));

  return text.replace(/#\s*([A-Za-z_][\w.]*)\s*#/g, (fullMatch, parameterName) => {
    const rootName = parameterName.split(".")[0];

    if (iterateCollections.has(rootName)) {
      return fullMatch;
    }

    return `#{${convertHashParameter(parameterName)}}`;
  });
}

function convertIteratePlaceholders(text, iterateStack) {
  return iterateStack.reduce((converted, context) => {
    const collectionPattern = escapeRegExp(context.collection);
    const propertyPattern = new RegExp(`\\$\\s*${collectionPattern}\\[\\]\\.([A-Za-z_][\\w]*)\\s*\\$`, "g");
    const itemPattern = new RegExp(`\\$\\s*${collectionPattern}\\[\\]\\s*\\$`, "g");
    const hashPropertyPattern = new RegExp(`#\\s*${collectionPattern}\\[\\]\\.([A-Za-z_][\\w]*)\\s*#`, "g");
    const hashItemPattern = new RegExp(`#\\s*${collectionPattern}\\[\\]\\s*#`, "g");

    return converted
      .replace(propertyPattern, (_, propertyName) => `\${${context.item}.${propertyName}}`)
      .replace(itemPattern, `\${${context.item}}`)
      .replace(hashPropertyPattern, (_, propertyName) => `#{${context.item}.${propertyName}}`)
      .replace(hashItemPattern, `#{${context.item}}`);
  }, text);
}

function convertTextSegment(text, iterateStack) {
  return convertDtoParameters(convertIteratePlaceholders(text, iterateStack), iterateStack);
}

function buildIfTag(tagName, tagSource) {
  const attributes = parseAttributes(tagSource);
  const property = attributes.property || "";
  const compareValue = attributes.compareValue || "";
  const operator = CONDITIONAL_TAGS.get(tagName.toLowerCase())?.operator || "";
  const propertyExpression = toCamelCase(property);

  return `<if test='${operator}"${compareValue}".equals(${propertyExpression})'>`;
}

function buildForeachTag(tagSource, iterateStack) {
  const attributes = parseAttributes(tagSource);
  const collection = attributes.property || attributes.collection || "";
  const separator = attributes.conjunction ?? attributes.separator ?? "";
  const item = `item${iterateStack.length + 1}`;

  iterateStack.push({ collection, item });

  return `<foreach collection="${collection}" item="${item}" separator="${separator}">`;
}

function convertMyBatisXml(source) {
  const tagPattern = /<\/?\s*(isEqual|isNotEqual|iterate)\b[^>]*>/gi;
  const iterateStack = [];
  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(source)) !== null) {
    const tagSource = match[0];
    const tagName = match[1];
    const normalizedTagName = tagName.toLowerCase();
    const isClosingTag = /^<\s*\//.test(tagSource);

    result += convertTextSegment(source.slice(lastIndex, match.index), iterateStack);

    if (normalizedTagName === "iterate") {
      if (isClosingTag) {
        iterateStack.pop();
        result += "</foreach>";
      } else {
        result += buildForeachTag(tagSource, iterateStack);
      }
    } else if (CONDITIONAL_TAGS.has(normalizedTagName)) {
      result += isClosingTag ? "</if>" : buildIfTag(normalizedTagName, tagSource);
    } else {
      result += tagSource;
    }

    lastIndex = tagPattern.lastIndex;
  }

  result += convertTextSegment(source.slice(lastIndex), iterateStack);

  return result;
}

function setStatus(message) {
  const status = document.getElementById("status");
  status.textContent = message;
}

function bindUi() {
  const sourceXml = document.getElementById("sourceXml");
  const resultXml = document.getElementById("resultXml");
  const convertButton = document.getElementById("convert");
  const clearButton = document.getElementById("clear");
  const loadSampleButton = document.getElementById("loadSample");
  const copyResultButton = document.getElementById("copyResult");

  sourceXml.value = SAMPLE_XML;
  resultXml.value = convertMyBatisXml(SAMPLE_XML);

  convertButton.addEventListener("click", () => {
    resultXml.value = convertMyBatisXml(sourceXml.value);
    setStatus("변환이 완료되었습니다.");
  });

  clearButton.addEventListener("click", () => {
    sourceXml.value = "";
    resultXml.value = "";
    setStatus("입력과 결과를 초기화했습니다.");
  });

  loadSampleButton.addEventListener("click", () => {
    sourceXml.value = SAMPLE_XML;
    resultXml.value = convertMyBatisXml(SAMPLE_XML);
    setStatus("예시를 불러왔습니다.");
  });

  copyResultButton.addEventListener("click", async () => {
    if (!resultXml.value) {
      setStatus("복사할 변환 결과가 없습니다.");
      return;
    }

    await navigator.clipboard.writeText(resultXml.value);
    setStatus("변환 결과를 클립보드에 복사했습니다.");
  });
}

if (typeof document !== "undefined") {
  bindUi();
}

if (typeof module !== "undefined") {
  module.exports = {
    convertMyBatisXml,
    toCamelCase,
  };
}
