# mybatis-migration-tool

브라우저에서 실행되는 MyBatis 2 XML 문법을 MyBatis 3 XML 문법으로 변환하는 정적 HTML/JavaScript 도구입니다.

## 사용 방법

1. `index.html` 파일을 브라우저로 엽니다.
2. 원본 XML 영역에 MyBatis 2 XML을 붙여 넣습니다.
3. `변환하기` 버튼을 누르면 변환 결과 영역에 MyBatis 3 XML이 생성됩니다.

## 지원 변환

- `<isEqual property="AA_TYPE" compareValue="s001">` -> `<if test='"s001".equals(aaType)'>`
- `<isNotEqual property="BB_FFF_CODE" compareValue="C001">` -> `<if test='!"C001".equals(bbFffCode)'>`
- `<iterate property="AAA_LIST" conjunction=",">` -> `<foreach collection="AAA_LIST" item="item1" separator=",">`

조건 태그의 DTO `property` 값과 일반 `#PARAM_NAME#` 파라미터는 camelCase로 변환합니다. `iterate`의 collection 이름과 리스트 내부 컬럼명은 원래 이름을 유지합니다.

## 검증

```bash
node test.js
```
