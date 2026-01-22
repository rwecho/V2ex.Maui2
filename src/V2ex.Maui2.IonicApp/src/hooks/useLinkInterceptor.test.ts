import { isV2exInternalLink, extractInternalPath, extractTopicId, extractNodeName, extractUsername } from "./useLinkInterceptor";

describe("useLinkInterceptor", () => {
  describe("isV2exInternalLink", () => {
    it("should identify internal topic links", () => {
      expect(isV2exInternalLink("/t/123456")).toBe(true);
      expect(isV2exInternalLink("https://www.v2ex.com/t/123456")).toBe(true);
    });

    it("should identify internal node links", () => {
      expect(isV2exInternalLink("/go/python")).toBe(true);
      expect(isV2exInternalLink("https://www.v2ex.com/go/python")).toBe(true);
    });

    it("should identify internal member links", () => {
      expect(isV2exInternalLink("/member/testuser")).toBe(true);
      expect(isV2exInternalLink("https://www.v2ex.com/member/testuser")).toBe(true);
    });

    it("should identify external links", () => {
      expect(isV2exInternalLink("https://github.com/test")).toBe(false);
      expect(isV2exInternalLink("https://example.com/test")).toBe(false);
      expect(isV2exInternalLink("http://external.com")).toBe(false);
    });
  });

  describe("extractInternalPath", () => {
    it("should extract path from relative URLs", () => {
      expect(extractInternalPath("/t/123456")).toBe("/t/123456");
      expect(extractInternalPath("/go/python?p=1")).toBe("/go/python?p=1");
    });

    it("should extract path from absolute V2EX URLs", () => {
      expect(extractInternalPath("https://www.v2ex.com/t/123456")).toBe("/t/123456");
      expect(extractInternalPath("https://www.v2ex.com/go/python?p=1#comments")).toBe("/go/python?p=1#comments");
    });
  });

  describe("extractTopicId", () => {
    it("should extract topic ID from URLs", () => {
      expect(extractTopicId("/t/123456")).toBe("123456");
      expect(extractTopicId("https://www.v2ex.com/t/789012")).toBe("789012");
    });

    it("should return null for non-topic URLs", () => {
      expect(extractTopicId("/go/python")).toBeNull();
      expect(extractTopicId("/member/test")).toBeNull();
      expect(extractTopicId("https://github.com")).toBeNull();
    });
  });

  describe("extractNodeName", () => {
    it("should extract node name from URLs", () => {
      expect(extractNodeName("/go/python")).toBe("python");
      expect(extractNodeName("https://www.v2ex.com/go/python?p=1")).toBe("python");
      expect(extractNodeName("/go/node-name_test")).toBe("node-name_test");
    });

    it("should return null for non-node URLs", () => {
      expect(extractNodeName("/t/123456")).toBeNull();
      expect(extractNodeName("/member/test")).toBeNull();
      expect(extractNodeName("https://github.com")).toBeNull();
    });
  });

  describe("extractUsername", () => {
    it("should extract username from URLs", () => {
      expect(extractUsername("/member/testuser")).toBe("testuser");
      expect(extractUsername("https://www.v2ex.com/member/testuser")).toBe("testuser");
    });

    it("should return null for non-member URLs", () => {
      expect(extractUsername("/t/123456")).toBeNull();
      expect(extractUsername("/go/python")).toBeNull();
      expect(extractUsername("https://github.com")).toBeNull();
    });
  });
});
