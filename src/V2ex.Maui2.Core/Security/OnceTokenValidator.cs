using System;
using System.Collections.Generic;

namespace V2ex.Maui2.Core.Security;

public class OnceTokenValidator
{
    private const int MinTokenLength = 16;
    private const int MaxTokenLength = 64;
    private const string ValidCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private readonly HashSet<string> _usedTokens = new();
    private readonly int _maxHistorySize;

    public OnceTokenValidator(int maxHistorySize = 1000)
    {
        _maxHistorySize = maxHistorySize;
    }

    public bool IsValid(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        if (token.Length < MinTokenLength || token.Length > MaxTokenLength)
        {
            return false;
        }

        foreach (var c in token)
        {
            if (!ValidCharacters.Contains(c))
            {
                return false;
            }
        }

        return true;
    }

    public bool IsUsed(string token)
    {
        return _usedTokens.Contains(token);
    }

    public void MarkAsUsed(string token)
    {
        if (_usedTokens.Count >= _maxHistorySize)
        {
            _usedTokens.Clear();
        }

        _usedTokens.Add(token);
    }

    public void ClearHistory()
    {
        _usedTokens.Clear();
    }

    public void ValidateAndMark(string token)
    {
        if (!IsValid(token))
        {
            throw new ArgumentException($"Invalid once token: {token}", nameof(token));
        }

        if (IsUsed(token))
        {
            throw new InvalidOperationException($"Once token has already been used: {token}");
        }

        MarkAsUsed(token);
    }
}