using FluentAssertions;
using HtmlAgilityPack;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Tests;

public class TopicInfoTests
{
    [Fact]
    public void Parse_UsesSingleNodeBreadcrumb_WhenTopicHeaderHasOneAnchor()
    {
        const string html = """
            <html>
              <body>
                <div id="Wrapper">
                  <div class="box">
                    <div class="header">
                      <a class="node" href="/go/test">测试节点</a>
                      <h1>测试标题</h1>
                      <div class="fr"><img src="https://example.com/avatar.png" /></div>
                      <small><a href="/member/tester">tester</a> at 1 小时前</small>
                    </div>
                    <div class="cell">
                      <div class="topic_content">正文</div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
            """;

        var document = new HtmlDocument();
        document.LoadHtml(html);

        var result = document.DocumentNode.GetEncapsulatedData<TopicInfo>();

        result.Title.Should().Be("测试标题");
        result.UserName.Should().Be("tester");
        result.NodeName.Should().Be("测试节点");
        result.NodeLink.Should().Be("/go/test");
        result.Content.Should().Be("正文");
    }
}
