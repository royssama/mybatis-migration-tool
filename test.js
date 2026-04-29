const assert = require("node:assert/strict");
const { convertMyBatisXml, toCamelCase } = require("./app");

assert.equal(toCamelCase("AA_TYPE"), "aaType");
assert.equal(toCamelCase("BB_FFF_CODE"), "bbFffCode");
assert.equal(toCamelCase("OFF_SRCTYPE"), "offSrctype");
assert.equal(toCamelCase("SRCTYPE"), "srctype");

const conditionalSource = `<isEqual property = "AA_TYPE" compareValue="s001" >
  AND AA_TYPE = #AA_TYPE#
</isEqual>
<isEqual property = "SRCTYPE" compareValue="s001" >
  AND SRCTYPE = #SRCTYPE#
</isEqual>
<isNotEqual property = "BB_FFF_CODE" compareValue="C001" >
  AND BB_FFF_CODE != #BB_FFF_CODE#
</isNotEqual>`;

assert.equal(
  convertMyBatisXml(conditionalSource),
  `<if test='"s001".equals(aaType)'>
  AND AA_TYPE = #{aaType}
</if>
<if test='"s001".equals(srctype)'>
  AND SRCTYPE = #{srctype}
</if>
<if test='!"C001".equals(bbFffCode)'>
  AND BB_FFF_CODE != #{bbFffCode}
</if>`,
);

const iterateSource = `<iterate property ="AAA_LIST" conjunction="" >
  <iterate property ="SUB_LIST" conjunction="," >
    ,NVL($SUB_LIST[].SUB_COL01$_$AAA_LIST[]$,0) as $SUB_LIST[].SUB_COL01$_$AAA_LIST[]$
  </iterate>
</iterate>`;

assert.equal(
  convertMyBatisXml(iterateSource),
  '<foreach collection="aaaList" item="item1" separator="">\n' +
    '  <foreach collection="subList" item="item2" separator=",">\n' +
    '    ,NVL(${item2.SUB_COL01}_${item1},0) as ${item2.SUB_COL01}_${item1}\n' +
    "  </foreach>\n" +
    "</foreach>",
);

console.log("All tests passed");
