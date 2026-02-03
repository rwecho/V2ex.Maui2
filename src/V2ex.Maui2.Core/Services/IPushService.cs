using System.Threading.Tasks;

namespace V2ex.Maui2.Core.Services
{
    public interface IPushService
    {
        Task Register(string feedUrl);
    }
}
