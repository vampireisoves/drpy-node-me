function eE(e) {
    return M(function (e) {
        for (var t = "", n = 0, r = Object.keys(e).sort(); n < r.length; n++) {
            var o = r[n]
                , i = e[o]
                , a = "error" in i ? "error" : JSON.stringify(i.value);
            t += "".concat(t ? "|" : "").concat(o.replace(/([:|\\])/g, "\\$1"), ":").concat(a)
        }
        return t
    }(e))
}

var O = [0x87c37b91, 0x114253d5]
    , P = [0x4cf5ad43, 0x2745937f]
    , C = [0, 5]
    , T = [0, 0x52dce729]
    , I = [0, 0x38495ab5];

function w(e, t) {
    var n, r, o = e[0] >>> 16, i = 65535 & e[0], a = e[1] >>> 16, c = 65535 & e[1], u = t[0] >>> 16, s = 65535 & t[0],
        l = t[1] >>> 16, f = 65535 & t[1], d = 0, p = 0;
    n = 0 + ((r = 0 + (c + f)) >>> 16),
        r &= 65535,
        n += a + l,
        p += n >>> 16,
        n &= 65535,
        p += i + s,
        d += p >>> 16,
        p &= 65535,
        d += o + u,
        d &= 65535,
        e[0] = d << 16 | p,
        e[1] = n << 16 | r
}

function _(e, t) {
    var n, r, o = e[0] >>> 16, i = 65535 & e[0], a = e[1] >>> 16, c = 65535 & e[1], u = t[0] >>> 16, s = 65535 & t[0],
        l = t[1] >>> 16, f = 65535 & t[1], d = 0, p = 0;
    n = 0 + ((r = 0 + c * f) >>> 16),
        r &= 65535,
        n += a * f,
        p += n >>> 16,
        n &= 65535,
        n += c * l,
        p += n >>> 16,
        n &= 65535,
        p += i * f,
        d += p >>> 16,
        p &= 65535,
        p += a * l,
        d += p >>> 16,
        p &= 65535,
        p += c * s,
        d += p >>> 16,
        p &= 65535,
        d += o * f + i * l + a * s + c * u,
        d &= 65535,
        e[0] = d << 16 | p,
        e[1] = n << 16 | r
}

function x(e, t) {
    var n = e[0];
    32 == (t %= 64) ? (e[0] = e[1],
        e[1] = n) : t < 32 ? (e[0] = n << t | e[1] >>> 32 - t,
        e[1] = e[1] << t | n >>> 32 - t) : (t -= 32,
        e[0] = e[1] << t | n >>> 32 - t,
        e[1] = n << t | e[1] >>> 32 - t)
}

function k(e, t) {
    0 != (t %= 64) && (t < 32 ? (e[0] = e[1] >>> 32 - t,
        e[1] = e[1] << t) : (e[0] = e[1] << t - 32,
        e[1] = 0))
}

function L(e, t) {
    e[0] ^= t[0],
        e[1] ^= t[1]
}

var j = [0xff51afd7, 0xed558ccd]
    , S = [0xc4ceb9fe, 0x1a85ec53];

function E(e) {
    var t = [0, e[0] >>> 1];
    L(e, t),
        _(e, j),
        t[1] = e[0] >>> 1,
        L(e, t),
        _(e, S),
        t[1] = e[0] >>> 1,
        L(e, t)
}

function M(e, t) {
    var n, r = function (e) {
        for (var t = new Uint8Array(e.length), n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r > 127)
                return new TextEncoder().encode(e);
            t[n] = r
        }
        return t
    }(e);
    t = t || 0;
    var o = [0, r.length]
        , i = o[1] % 16
        , a = o[1] - i
        , c = [0, t]
        , u = [0, t]
        , s = [0, 0]
        , l = [0, 0];
    for (n = 0; n < a; n += 16)
        s[0] = r[n + 4] | r[n + 5] << 8 | r[n + 6] << 16 | r[n + 7] << 24,
            s[1] = r[n] | r[n + 1] << 8 | r[n + 2] << 16 | r[n + 3] << 24,
            l[0] = r[n + 12] | r[n + 13] << 8 | r[n + 14] << 16 | r[n + 15] << 24,
            l[1] = r[n + 8] | r[n + 9] << 8 | r[n + 10] << 16 | r[n + 11] << 24,
            _(s, O),
            x(s, 31),
            _(s, P),
            L(c, s),
            x(c, 27),
            w(c, u),
            _(c, C),
            w(c, T),
            _(l, P),
            x(l, 33),
            _(l, O),
            L(u, l),
            x(u, 31),
            w(u, c),
            _(u, C),
            w(u, I);
    s[0] = 0,
        s[1] = 0,
        l[0] = 0,
        l[1] = 0;
    var f = [0, 0];
    switch (i) {
        case 15:
            f[1] = r[n + 14],
                k(f, 48),
                L(l, f);
        case 14:
            f[1] = r[n + 13],
                k(f, 40),
                L(l, f);
        case 13:
            f[1] = r[n + 12],
                k(f, 32),
                L(l, f);
        case 12:
            f[1] = r[n + 11],
                k(f, 24),
                L(l, f);
        case 11:
            f[1] = r[n + 10],
                k(f, 16),
                L(l, f);
        case 10:
            f[1] = r[n + 9],
                k(f, 8),
                L(l, f);
        case 9:
            f[1] = r[n + 8],
                L(l, f),
                _(l, P),
                x(l, 33),
                _(l, O),
                L(u, l);
        case 8:
            f[1] = r[n + 7],
                k(f, 56),
                L(s, f);
        case 7:
            f[1] = r[n + 6],
                k(f, 48),
                L(s, f);
        case 6:
            f[1] = r[n + 5],
                k(f, 40),
                L(s, f);
        case 5:
            f[1] = r[n + 4],
                k(f, 32),
                L(s, f);
        case 4:
            f[1] = r[n + 3],
                k(f, 24),
                L(s, f);
        case 3:
            f[1] = r[n + 2],
                k(f, 16),
                L(s, f);
        case 2:
            f[1] = r[n + 1],
                k(f, 8),
                L(s, f);
        case 1:
            f[1] = r[n],
                L(s, f),
                _(s, O),
                x(s, 31),
                _(s, P),
                L(c, s)
    }
    return L(c, o),
        L(u, o),
        w(c, u),
        w(u, c),
        E(c),
        E(u),
        w(c, u),
        w(u, c),
    ("00000000" + (c[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (c[1] >>> 0).toString(16)).slice(-8) + ("00000000" + (u[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (u[1] >>> 0).toString(16)).slice(-8)
}


const e = {
    "fonts": {
        "value": [
            "Calibri",
            "Century",
            "Century Gothic",
            "Franklin Gothic",
            "MS Reference Specialty",
            "MS UI Gothic",
            "MT Extra",
            "Marlett",
            "Monotype Corsiva",
            "Pristina",
            "Segoe UI Light",
            "SimHei"
        ],
        "duration": 27
    },
    "domBlockers": {
        "duration": 13
    },
    "fontPreferences": {
        "value": {
            "default": 129.03750610351562,
            "apple": 129.03750610351562,
            "serif": 108.80000305175781,
            "sans": 129.03750610351562,
            "mono": 95.20000457763672,
            "min": 8.074999809265137,
            "system": 129.03750610351562
        },
        "duration": 16
    },
    "audio": {
        "value": 124.04347527516074,
        "duration": 3
    },
    "screenFrame": {
        "value": [
            0,
            0,
            50,
            0
        ],
        "duration": 0
    },
    "canvas": {
        "value": {
            "winding": true,
            "geometry": "data:image/png;base64,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",
            "text": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAA8CAYAAABYfzddAAAAAXNSR0IArs4c6QAAGchJREFUeF7tnQuQVNWZx3/n9mMeMAyP4TEMDOjISwIoomMMqWhKsYLJmmi0Ytw1LEFEqzRrTFLZ3ZBlk5SJuxpXU6uISDC7urUQDLuJusFdcRN8oAgCosNLYXipjOjwmEd333s23719eu70dPd09wwwuPdUWSVzz/M73/983/c/372tCEoggUACZ6wE1Bk780/oxPV89Cd0aTmXpZYQ6GIRGx8IrQihncwmpxzAZREY2A/KI9AWh+ZWON5+MpeYse8AwMWJPABwcXI7aa1OGYAHlsOkahjUr+tajrZCwyFoOn7S1pnecQDg4kTd9wF8y+Jr0GqVtzy1GnQdljOPxbe+WtySfa28vu8kEZ7t/jWceAalf88jC37S476lg7mPVRTaZzYAH2Agn+F7/JyVXMOmnk1v/HD47Neg9stwYj+89SA4YnUtmLgABk6Cg/8D6x6DbQc4FU59AODitjQzgG9e8iRK35DsshnLmYVjXYvlPMjiWw8UN1QRrRY8fBF26O+wQ18jEr8CrZa5c+k98MrBsA64HlgBzETphb0CYAPeAvvMBOBjlDKb21nHOaxicc8APLYKLvoMfH4VL//vS0SiEWZU74Utd8O4uTTYl7Nvz16u+NJsePFmeO1pePtQEZtXWJMAwIXJy9TuDOAFD9fgWC8C+1yrtOybx1JWBKb0Gnjynesti3+AY53Lo/O/nm+Tgur9f7PAloLLz4UJc9CT7+KKafUugJ/94ypYcyXM/CVz5/6Md3ftZuXzz1J14jnYcg+sbfDi45NYAgAXJ9wOAHdYDFLg9fd5y+LbUXp9r1i/fOcqnoCUAMD0igtdPRDOr4XhM+Hif+aBn9xDSUkJC26aDq/cDlP/hn9/oZ2GrW+x8N67sbbeDXtWevHwO4fz3bWi6gUALkpsPupe3FXHWoPS92Z1ITss9Jik63kz8F+A92+x2p6ruwqt/g3LeQutrkSrv0fpX7tTFBdYq1HJuNZzz9Nd4s7jeCtT+lqU3o9jrcRyrku1ESut1Y+Ty9+L5XzGdfM7+hDXeD6wNTm/byXr70Xp+9Dq+k4xMLwMfNp1p6Gjv06xuDsfz9U24yj9bRzrq8nQw5OFFH9c3RGadPTr37cFD19U6bSvb6Ys9ddKWlnDP1HDx6kY+C2qWcjVbp0beI0nWcpTnM+1LGAmu3iGX1BBW1eNmDQSzqry/l46DGLNUHUBtH0AR3dBWTVUToCmV8Eqgfgx0Ak41Ayb9hanYXm2CgCcp6DSqnVYYKOgApRHFjyVtbsOYub+VD2/pZTnkfgcoNIHLE+hQ/YjroILuMWqdmdh/c87ADkwBXq/CyzuvgeQSwhZ12I7Et92HCzy3Kv/cxfkUvzhggGbCRVi0bdd8Gm1Dzt0SxKI3pq9Q2Ne2jjmkFnv9iuAjkeeSwFY6V/iWM9mJeCScl3F4plCUgkg5/INF7wXsaeLBZbn3+Y6XuQfXHBLnLycT3M7a7NrwrTRUDMIJxaisfE7DLn8wqx1j25oYLC+m7KhLXDkOLzyTnEalmerAMB5CioHgD1L1h2ApYN0wIqiw+gkMGrQqp5HFvwiqehXplxyT/Gz/zt9DekA97wEzwIbgCndcZD4raG4+wZIArpMB093MbAf8H7yLtNBIICVcfxzMADW6ihKi3y+kJUE9No9u56fTjGA/QJ3sJRfZQSwIbauZBs/4BkX8FJyMtRTRsHowS6r/Ie/nU3sWGlWrVGWw6X3/JZQqQ2Hj8Fr7xanYXm2CgCcp6B6bIGlA78C26FJWM4A17KJEkNNKlbuDrDpzwsBMBzoBFBp67+28SyeZwnTgWU8jO4A7B0YS1PA8zPLxr02ljwXgD133LPQubybm5c8+WO1+gYB5KuMZR438SwPuhY2UwwsoL2fy12X+SfM5g6ed+tmLXXDYMII9/H2lVPZ94dzslYdOvUg025+xXve+CG8eXIvHwIA9xTA3ZNY17hDpINBABuPLHfdYymW87L7b89lzW1xewJgv4trSC6/lU23wH7LmC+A/QD33P/Zvhi+syueC8BytwzCB3htsl3FpcXA/iujTAA2f7uL59jPIO4he+Tj7s2Q/lB/tvu/8eNRXvv5pbQc7t9Fc6IVbVx45wue+yxlyz7Y/1FxGpZnqwDAeQoqqwWWB4bIMoSPgFCKKLIQNH422Is3RwNLWXLL40mrvKrTPerJBLAQX4bAMpbND7hobEAXC21iZAFRLHrUjU8969hxFywxr6yz82HQmTwzHojEwRBH6cczWnp/DCyEl5GZuaLzb4aMF7If2a++d0MmK5qNhRbLey+zUrFyTjUQxuNzE6C8xAPxiQgNK87jg801aNsSD4Ehk97n3K9tpGRQkgRL2PD825BwitOwPFsFAM5TUDkB7IHY3AULAeQVQzr5G6fHh+kWrjM7LAARdve7yS66/tuv1F3n4LHVUvJhob16cp/trcEAvLML3AwscRnnrnfeXV3ezsktjS5Jp9R2tFMNSg4yGecOtLorNS7qbdCTks8WunfaJkEm3Z3uPLeUpIVl/kd+7TLQexni/j3dMn+Xr/II/5qZeU7Xi8H9PCus8kzCe6MRDuZwy4vTuy6tAgAXJ8g8d7G4znu9lZ/E6o1srF6fYA86TLL3Wi940N/LfzOJAbS6RFamIrHyes7KzT6nNxxZCVNrQRI7cpVTcP9rhg8AXJzunHkANqmVxr0vbt19r1Uy60yr+SaF1b0a+jFXsZCns1rXBdzIXF7MCvCsC5W3j0YPgZEDoSzaUS2W8CyuEFen8K2kAMDFqWTfB3Am5vdU5mMXJ9fCW2VwoU0SR7r1Fas7i79CEj56nBtd+ExPSosAwMWJte8DuLh1nbGtTtnrhH1MQgGAi9uQAMDFye2ktQoAfNJE+4nsOABwH9vWAMB9bEP6+HQCAPfxDQqmF0gglwQCAAf6EUjgDJZAAOAzePOCqQcSCAAc6EAggdMgAb320jDsCXO4X5ihJxIwNqEueyFR6FQCABcqsaB+IIEiJaCfu6CS1vhgbKsS7FCXbrSTQEWaKTl+RM3edTSfYQIA5yOloE4ggR5IQP9uyiBiSl6z9d4iyafYVhuV4f3qitclZz9rCQCcjzCDOoEEipSA/s9za7FLh1J7FVTPhJYmOLQGmjZ27bGqHqpnQXklHFoHjU+DpQ+pqzcdzDZ8XgC+bS39ExUMVxb9bU1YOrM0Ogbx0jBHRnzE+4suo2D/vUiZnLxmGnXbm4yKtzJEh3BdHEtzQt68cxQD5f+XzKDh5E2g+57nb2Cio+hHgiNL63E/kzFP3mYIM7gvzC/TCm7bxohYGzWna36nSz569adGo9Uw6h+A6ss6i2b9dzwgmyLf6J7+o851GlfDxh+CFc4K4pwAnr+BiAox1nYYYHpWFjZxcKIoZcuXwMFRJErCND48lZP71nf3+t2jGgveoCZh436yQjs4ckg5IY6rBHZfAUgA4MK3+HQAWP/mvIFg17mWd/pP3UmvefppNq5bz6133UFlZTms+TzEW6C8Cmb9nqamZh7+2X3MnHUZl83y3p5l/bfg0Fo40bpT/XnXuDgrgBdtI3rgBON0iFJRZmVzeFQ9BxcpUm923/pHBtlljHIUUSdBorQ/ux+azKn7PY7C9zJnC7PRKsGxR+vZ0cvd90p3AYALF+OpBrDWKH4zeSrKClN/r+sWb924kW/dKB9xhSn103lg+aMd4Exa39uun0PD1q1unUd/8wR1EyeCscIR1a6+uOXN9NVnBfD8DdSJ2yjAbNe8+8TFZGTF5m+g3FHIx5Ui4iKNvIAdfpAXLu7T18JstN89PX2zyTxyAODCd+SUA/i346tIlHgfk5j5KFTV8/Tq1dz3197Xj6uqq1jx/O8991gAWvd1mPJ9vnjx52lp9jirhQ/81LPC4maLu+2W0G71lTc6fV0hI4DnrqMiFKXOjQPjvL/0YvbnEpu4nrZmKDFaSj9kb/swhjuKoSGLo4+cz05/22++xGDKGSPut6U5vGQG8nWLVLl5PeN1mArzzChstJQDLTHaQglGKQvD5sXDYd5bPI0PxN23FWNwqFAWlngNuoTm2g9p7C4+TwE3bZEhRUI77HRshmdzoa/bRrTyODWhCAMMPyDtEvDx6GYOpI9t1uMoDoUd9wPQlTKso2itaGfP/ZfQikbN3US1pZGPOMvBqOW5pZGPM9fmioHDZexvbac24lDqKPe73xK/Ny07n0Oorr9yNH8DlTrMcDTl2knF/Tpu0WbHef9X9XzoF0v6fpRoRurkWMrGdsJ8lL7ubDGweHn726gDyi1NrDXCO/8yzeUccpc0+UhlHaY9FOe9cBnh9Hg7HcBz3qU0fITxSdkeXDKDLr8d8xeb6Vduc07CxrLDvLv8/FxfC+w8Xf3UtPEop8L965S7oO4bLjBvu3EOjbsbuetHC7nqui/DuhuhaatHbtU/xMrHn3RdaLG8DzzxKOXl5dDwsPefW/TH6itv7vaPlhHA8ze4SjJUFLElxK68hOrr1YA0lCBRUsmOX4wj9XuVpm9XaR2OL7uQ7aapEawokhGaUZgkmVTuLkNcegtLFFSUO2HxXshikLYplRhdbtPkudRVIY7VTGNXLq9A5qQdBpu4XodwrJgLmsSAOLuPhRiRCcC3bmFQoo0xhvBy+QFvfuaOLx4t5R1/WOFbT0xCDzNfJ0T7mGZ2cClO4wbGWRbu1+bcWDyMlj7FG3JCOGFFNBOJJfMNKZTUTZeDyLp2Bjv9cpi7kZFhhxFGjjIWkY75G9kum06KBU3fD2mbPhbQMuooO83hlQnAi9YSbuxPnayzEPAu0lgHNnOOtnEB4pePzFfGlgPOT5hlssApDzPM8WXTOnTQ6OL8DVQ7ipEhRev2Zna8kCdJ67rPT009H0t72CqvhctWuKxzvLmBppZKqqfM8tjotV9JDheBWb+DSITGjWuormwhUjURKqfA2uuhJXm+aCehrtm2uVsAz32NCUkFahk1ne2FusRysu5pZUIoTJgW9j52CUd8gvFYVI/hjfkBPn+Da3FqbU0spNi+ZAbxlMuYZIQ/KuOdlZOJiQLsH8A49/QOoxM2dskJGh/+rEekiVfgKIbLBtsn2L1sJt4H+nKUbC50JgWYs5bSaAXjXBCGaGtT7DEH3W3b6J9o5SzzTCXYIWuRoVMACKMtzfuLz8P9Xut1KwitvB7bHHBJ3uHg0ot5X577+3SXkIGFTi4tHmlhn5HDvFcYrkOMlAPN7/EYL0uVYBGnackF7DMWWtamKjk7pCmTtWWaf3L/Tpj9kH/f9BI1pVGGyyFgwX7xjJJz78RCCwh9h1SXQy7nHr3CKCLeviqblHzEYkZjnGW8szwAXBWH2qiFnW6kZH4HX2e86Gk4xHtmj7rTH/dAWTu2lI8rJueuG4FIJcSbOqoJkdUi7nM3v0E1OrpFzXg9VamLBb50LeEJlYy3NWWZXOB8FpFUVDeG9iuNsbBuvkkExD0JKd5ZMgPX8TdAcSJ8tGwq7k8B+AAcrxjGzvtH02rmMOdVRoRD1AiAHYsDS6d4yi7FjGWFCfuVqbcAbBhrsXqlzex+6LLO5N2NrzCgvISzXU/BNzezHu3Qbg4pMydz8LkWNkPoMmcTA0MJV0mtTAAWzyH9wHTlmlT6hCY2toztiyYTEwujQwyXQ7T6T5Y/g6vvHqZiXSWMWDID9xuzufZDFH//RibIoZqw+HD5+d6HvPwWWDgSY0ELJT67k4+RuXggeQA4YmsmCODTQWoON5m7Hcvv8Dd7qP9jQgVOVNxzr8QjNB+qhWqJFAoshxqorO0UYUI4+rb60uvJ7/3i+22kZN9uLJlcWE/InAWbGebAKCdBq7HiN61nSKSE2rDmuLYJJV0dNwYxB4fEU/Ip8SUzcI8nv8uWfgdrXPWwxLs+JUu2S61D4ueHJvNed+IrxAL75vXxkhl0ikvMOLdsYpxcwfkPwlQMnBY+SBtxyWPtjBVXsK2Enemhix8gWSxwRo9JrFNpu+stqGgJe/K57ssm21zzlzWkvDefh+AHsBOhnQSDCwWvXz7hEE620M7HoaTu7LORWN/cyBilqUonX1OHcxb3Opce6SemDKIc7+Pbgt94hPX3fYOZf7zVdZHzLi1x1n32QWYufLxzk5LWnf40yy4W2K8kPbHAd+6j7NgHjJOYzAjbuIdC4Ih7GXYYYmlcAAiZYmvXYtmJwexYfpb361yZWFezotMFYP8hl+tw8HEJqTgq13qMR5HJOps1z9vMWQKAjAAOc2TpNC+5w1/yme/tz1DCYEripVTEFP1DDmViyQyR18UC+wDqHyvTIWgA7K8n+xyHPYWQQ6afXPKZs4mxSb3qFsDGo5ED01hao/9WmLJ0ry4f8OlnzhlAe5mEdqmy7odX0dLs0jcFlcrqZuq/70v2kNblqkFduSVF9GUksYzlcMmIImJgM8u5m5kQhn7iwo6YSpO4V2JhxW22IpSIhdaadomxnIQbOw1PPzTOZABnUrhc68lHQTMBpLvrr2wAFssciTEqrOiXZKxTCpZkvlVvA1hCDvGY5AAvVL/ykU8mwiybBfaHi8aNzmZI8kWe/u0F5SRi3rfAk2Xr4/Uc2libbxeperUzG5h4nXcvnColrW+q2btSpHA2FtowcHmx0KIIZXHXbYgn2jhgCCPjioiVjQ3hgFD3Qj5I7NcaISpunUwscoJdbYOpsRIuI9mJ1j+TAexj3FMHYb4W+Gg5O4SsS9/1nADOwwInbA4sv4j3hBRrO06dcAQSOzttbkwuV1gtFQ5Hj1ZSRpwx6eFJrvnLXHNZYJNTECnBisBYl63P45rSyCAfABuZdxcDmz59OurmMBx83U1MGmo8w0JRp1cQIjLlPH+7lkOVrPuZpFLm70JHiFO/cA3lValwFyzL4c82v6F814G9cg9sSJIkOFOklEsG9KNONs7WNEUtRsq1jtwNp2LeEKXCxiZshvjdbSOAvghgmZt4F8kDJ2sMbOKxTDFwJn7BnP5CymVjzotJ5PDtQyoGNl6WsMw1EXYKseVXuhRfkcYv9ATAflAt2MTYhMMQlwQsyS+Dzx8yZYuBzbryBXCKsIq4/O8eudeOOZRGfDxMwSB+6lOTUKqTz9ywcgqN6ybm3VXdrK3UXZWWdq+tY+qazZ0yBLNmYqUY4W4ysfwnebr7a0CasCnRUVrSLay5i0teVZRIskK6y95XAZwvC51kRFNeRa71yNXYgX5McNNXFU2PTXcTN1LFz7JmioElrmxp5530rDnf1ZTLfEuH3RGVZm9604X2g0oY5X0tjBcWONMddSZN746Flpdu2iqpszThfAHsP4zDFh/aeNmH6TcEeSNPrpJWTarGCo9Mb7N79RR2r+0exBnBK51ptU9ds8W9mjMldy50nHGSHJExF1qj5q1nmLLc6wg3ySBTLrRh+tzxPfc5ZaENaZOaTQZ3qq8CuKf3wNkYfrne+dNvQFbbYXQowXsmSyj9njPbPbAQPLEo7xoGW/qzw4wIJdwbh0OmP+NByNVSFHb7SKqIE2GUFWeQxMUnC8Cy53+5kaE4jE46lqm55QKL39tLvwcu1YwVfZX2hQB43laGWw41dgztZvFlODwLAvCK60KEtk9LJXP4Gjc1VLF79XSaD7kJeJ1KZW0TE7+8lco63/1wqoZjs3nbFrWo410EeZTzbSRR0vAAzhLuK4X45NtIJhPKBWaY9hgdSuOflT91Mp09NK6dWKl0cJs++iqAZX49ycTKdUXnT+10s8K0l4nlbph3LxvKBGBb0i1tSmRvumRHSXw8lT0mWcN1kS33ntfLWEvLIlM2bRIfy129/+qpt1xos78+wjRe0c5ON5U0R+kuE0tccjfYLOB1S39qpZv4U2DqZKbp6hWTRxCxarItReLieEtHTBypjFNelePd/XB0r/rS612Q3f37wBo1/3X3Z/GqJLnDbHhSqdrj8OHyC3k/U56tTP72nZS0N7tZLdEMDHPqrlYUpuYE27PlDmdS+NN1jeTfFMmFHtTKaP+70kLmCQky8hgHC1mPv1+xTlaI4SrROe87gfsucOZrpARHElE+8ueLy+Hq2Lz/y+kcTlcmuUbx5zLLnpoc6LMv4iOTlOG3SL0NYPEsShJuPnQk72vLTLnQDu12mP1R242rBxYCYJGLL2QoKHUy12HTKSe6EBOeXtdymtXV23Zl6qJ7APdk4E9I21P9NssnRGynZRnmgPFnguUzEQPgQlMncwJYXOmyhnEkvNThooq2jpHYvFtd7+XZp5cAwHlINQBwHkI6BVVMcpAMlbBoTE8CMbwEESL5ps9KX5mSjnprOXoRFtPPHYUdGlpQn2GlsZ3DXP3mfv+1UQDggqToVTbXQWS5Zy2iy6BJERLwJ14Icx32CFHzkkgkoTlbXsLx53xnG2aRAEvK57AOVjAmmbef9UqwiOl2aqJXTI7SPzSMmB6EdpNYMhdFjJB1hIPhD9QtHS8tZK/e05l9QttL9pJ8qECuOdzXGzW6J3eDn1AxnfJl+cm3JA/T6RVIl7yL0vjY5I434DJN0k+uyvNicrOLXbxe8ekySo6435brVNoHJ9T1L+ck8QILnKfU73yJsmMlbqZYRJSivZXDv7rEe/UvKKdXAu7LGW3UEO34CIELXIfjR0tpzJTBlj7jtC/JxEKt7DevYJ7e1RU2ehADFyavoHYggT4lgQDAfWo7gskEEihMAgGAC5NXUDuQQJ+SQADgPrUdwWQCCRQmgQDAhckrqB1IoE9JIABwn9qOYDKBBAqTQADgwuQV1A4k0KckEAC4T21HMJlAAoVJIABwYfIKagcS6FMSCADcp7YjmEwggcIk8H/UEMkt1bCTIQAAAABJRU5ErkJggg=="
        },
        "duration": 9
    },
    "osCpu": {
        "duration": 0
    },
    "languages": {
        "value": [
            [
                "zh-CN"
            ]
        ],
        "duration": 0
    },
    "colorDepth": {
        "value": 24,
        "duration": 1
    },
    "deviceMemory": {
        "value": 8,
        "duration": 0
    },
    "screenResolution": {
        "value": [
            864,
            1536
        ],
        "duration": 0
    },
    "hardwareConcurrency": {
        "value": 8,
        "duration": 0
    },
    "timezone": {
        "value": "Asia/Shanghai",
        "duration": 0
    },
    "sessionStorage": {
        "value": true,
        "duration": 0
    },
    "localStorage": {
        "value": true,
        "duration": 0
    },
    "indexedDB": {
        "value": true,
        "duration": 0
    },
    "openDatabase": {
        "value": false,
        "duration": 0
    },
    "cpuClass": {
        "duration": 0
    },
    "platform": {
        "value": "Win32",
        "duration": 0
    },
    "plugins": {
        "value": [
            {
                "name": "PDF Viewer",
                "description": "Portable Document Format",
                "mimeTypes": [
                    {
                        "type": "application/pdf",
                        "suffixes": "pdf"
                    },
                    {
                        "type": "text/pdf",
                        "suffixes": "pdf"
                    }
                ]
            },
            {
                "name": "Chrome PDF Viewer",
                "description": "Portable Document Format",
                "mimeTypes": [
                    {
                        "type": "application/pdf",
                        "suffixes": "pdf"
                    },
                    {
                        "type": "text/pdf",
                        "suffixes": "pdf"
                    }
                ]
            },
            {
                "name": "Chromium PDF Viewer",
                "description": "Portable Document Format",
                "mimeTypes": [
                    {
                        "type": "application/pdf",
                        "suffixes": "pdf"
                    },
                    {
                        "type": "text/pdf",
                        "suffixes": "pdf"
                    }
                ]
            },
            {
                "name": "Microsoft Edge PDF Viewer",
                "description": "Portable Document Format",
                "mimeTypes": [
                    {
                        "type": "application/pdf",
                        "suffixes": "pdf"
                    },
                    {
                        "type": "text/pdf",
                        "suffixes": "pdf"
                    }
                ]
            },
            {
                "name": "WebKit built-in PDF",
                "description": "Portable Document Format",
                "mimeTypes": [
                    {
                        "type": "application/pdf",
                        "suffixes": "pdf"
                    },
                    {
                        "type": "text/pdf",
                        "suffixes": "pdf"
                    }
                ]
            }
        ],
        "duration": 0
    },
    "touchSupport": {
        "value": {
            "maxTouchPoints": 0,
            "touchEvent": false,
            "touchStart": false
        },
        "duration": 0
    },
    "vendor": {
        "value": "Google Inc.",
        "duration": 0
    },
    "vendorFlavors": {
        "value": [
            "chrome"
        ],
        "duration": 0
    },
    "cookiesEnabled": {
        "value": true,
        "duration": 0
    },
    "colorGamut": {
        "value": "srgb",
        "duration": 0
    },
    "invertedColors": {
        "duration": 0
    },
    "forcedColors": {
        "value": false,
        "duration": 0
    },
    "monochrome": {
        "value": 0,
        "duration": 0
    },
    "contrast": {
        "value": 0,
        "duration": 0
    },
    "reducedMotion": {
        "value": false,
        "duration": 0
    },
    "reducedTransparency": {
        "value": false,
        "duration": 0
    },
    "hdr": {
        "value": false,
        "duration": 0
    },
    "math": {
        "value": {
            "acos": 1.4473588658278522,
            "acosh": 709.889355822726,
            "acoshPf": 355.291251501643,
            "asin": 0.12343746096704435,
            "asinh": 0.881373587019543,
            "asinhPf": 0.8813735870195429,
            "atanh": 0.5493061443340548,
            "atanhPf": 0.5493061443340548,
            "atan": 0.4636476090008061,
            "sin": 0.8178819121159085,
            "sinh": 1.1752011936438014,
            "sinhPf": 2.534342107873324,
            "cos": -0.8390715290095377,
            "cosh": 1.5430806348152437,
            "coshPf": 1.5430806348152437,
            "tan": -1.4214488238747245,
            "tanh": 0.7615941559557649,
            "tanhPf": 0.7615941559557649,
            "exp": 2.718281828459045,
            "expm1": 1.718281828459045,
            "expm1Pf": 1.718281828459045,
            "log1p": 2.3978952727983707,
            "log1pPf": 2.3978952727983707,
            "powPI": 1.9275814160560204e-50
        },
        "duration": 1
    },
    "pdfViewerEnabled": {
        "value": true,
        "duration": 0
    },
    "architecture": {
        "value": 255,
        "duration": 0
    },
    "applePay": {
        "value": -1,
        "duration": 0
    },
    "privateClickMeasurement": {
        "duration": 0
    },
    "audioBaseLatency": {
        "value": -2,
        "duration": 0
    },
    "webGlBasics": {
        "value": {
            "version": "WebGL 1.0 (OpenGL ES 2.0 Chromium)",
            "vendor": "WebKit",
            "vendorUnmasked": "Google Inc. (Intel)",
            "renderer": "WebKit WebGL",
            "rendererUnmasked": "ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)",
            "shadingLanguageVersion": "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)"
        },
        "duration": 7
    },
    "webGlExtensions": {
        "value": {
            "contextAttributes": [
                "alpha=true",
                "antialias=true",
                "depth=true",
                "desynchronized=false",
                "failIfMajorPerformanceCaveat=false",
                "powerPreference=default",
                "premultipliedAlpha=true",
                "preserveDrawingBuffer=false",
                "stencil=false",
                "xrCompatible=false"
            ],
            "parameters": [
                "ACTIVE_ATTRIBUTES=35721",
                "ACTIVE_TEXTURE=34016=33984",
                "ACTIVE_UNIFORMS=35718",
                "ALIASED_LINE_WIDTH_RANGE=33902=1,1",
                "ALIASED_POINT_SIZE_RANGE=33901=1,1024",
                "ALPHA=6406",
                "ALPHA_BITS=3413=8",
                "ALWAYS=519",
                "ARRAY_BUFFER=34962",
                "ARRAY_BUFFER_BINDING=34964",
                "ATTACHED_SHADERS=35717",
                "BACK=1029",
                "BLEND=3042=false",
                "BLEND_COLOR=32773=0,0,0,0",
                "BLEND_DST_ALPHA=32970=0",
                "BLEND_DST_RGB=32968=0",
                "BLEND_EQUATION=32777=32774",
                "BLEND_EQUATION_ALPHA=34877=32774",
                "BLEND_EQUATION_RGB=32777=32774",
                "BLEND_SRC_ALPHA=32971=1",
                "BLEND_SRC_RGB=32969=1",
                "BLUE_BITS=3412=8",
                "BOOL=35670",
                "BOOL_VEC2=35671",
                "BOOL_VEC3=35672",
                "BOOL_VEC4=35673",
                "BROWSER_DEFAULT_WEBGL=37444",
                "BUFFER_SIZE=34660",
                "BUFFER_USAGE=34661",
                "BYTE=5120",
                "CCW=2305",
                "CLAMP_TO_EDGE=33071",
                "COLOR_ATTACHMENT0=36064",
                "COLOR_BUFFER_BIT=16384",
                "COLOR_CLEAR_VALUE=3106=0,0,0,0",
                "COLOR_WRITEMASK=3107=true,true,true,true",
                "COMPILE_STATUS=35713",
                "COMPRESSED_TEXTURE_FORMATS=34467=",
                "CONSTANT_ALPHA=32771",
                "CONSTANT_COLOR=32769",
                "CONTEXT_LOST_WEBGL=37442",
                "CULL_FACE=2884=false",
                "CULL_FACE_MODE=2885=1029",
                "CURRENT_PROGRAM=35725",
                "CURRENT_VERTEX_ATTRIB=34342",
                "CW=2304",
                "DECR=7683",
                "DECR_WRAP=34056",
                "DELETE_STATUS=35712",
                "DEPTH_ATTACHMENT=36096",
                "DEPTH_BITS=3414=24",
                "DEPTH_BUFFER_BIT=256",
                "DEPTH_CLEAR_VALUE=2931=1",
                "DEPTH_COMPONENT16=33189",
                "DEPTH_COMPONENT=6402",
                "DEPTH_FUNC=2932=513",
                "DEPTH_RANGE=2928=0,1",
                "DEPTH_STENCIL=34041",
                "DEPTH_STENCIL_ATTACHMENT=33306",
                "DEPTH_TEST=2929=false",
                "DEPTH_WRITEMASK=2930=true",
                "DITHER=3024=true",
                "DONT_CARE=4352",
                "DST_ALPHA=772",
                "DST_COLOR=774",
                "DYNAMIC_DRAW=35048",
                "ELEMENT_ARRAY_BUFFER=34963",
                "ELEMENT_ARRAY_BUFFER_BINDING=34965",
                "EQUAL=514",
                "FASTEST=4353",
                "FLOAT=5126",
                "FLOAT_MAT2=35674",
                "FLOAT_MAT3=35675",
                "FLOAT_MAT4=35676",
                "FLOAT_VEC2=35664",
                "FLOAT_VEC3=35665",
                "FLOAT_VEC4=35666",
                "FRAGMENT_SHADER=35632",
                "FRAMEBUFFER=36160",
                "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME=36049",
                "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE=36048",
                "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE=36051",
                "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL=36050",
                "FRAMEBUFFER_BINDING=36006",
                "FRAMEBUFFER_COMPLETE=36053",
                "FRAMEBUFFER_INCOMPLETE_ATTACHMENT=36054",
                "FRAMEBUFFER_INCOMPLETE_DIMENSIONS=36057",
                "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT=36055",
                "FRAMEBUFFER_UNSUPPORTED=36061",
                "FRONT=1028",
                "FRONT_AND_BACK=1032",
                "FRONT_FACE=2886=2305",
                "FUNC_ADD=32774",
                "FUNC_REVERSE_SUBTRACT=32779",
                "FUNC_SUBTRACT=32778",
                "GENERATE_MIPMAP_HINT=33170=4352",
                "GEQUAL=518",
                "GREATER=516",
                "GREEN_BITS=3411=8",
                "HIGH_FLOAT=36338",
                "HIGH_INT=36341",
                "IMPLEMENTATION_COLOR_READ_FORMAT=35739=6408",
                "IMPLEMENTATION_COLOR_READ_TYPE=35738=5121",
                "INCR=7682",
                "INCR_WRAP=34055",
                "INT=5124",
                "INT_VEC2=35667",
                "INT_VEC3=35668",
                "INT_VEC4=35669",
                "INVALID_ENUM=1280",
                "INVALID_FRAMEBUFFER_OPERATION=1286",
                "INVALID_OPERATION=1282",
                "INVALID_VALUE=1281",
                "INVERT=5386",
                "KEEP=7680",
                "LEQUAL=515",
                "LESS=513",
                "LINEAR=9729",
                "LINEAR_MIPMAP_LINEAR=9987",
                "LINEAR_MIPMAP_NEAREST=9985",
                "LINES=1",
                "LINE_LOOP=2",
                "LINE_STRIP=3",
                "LINE_WIDTH=2849=1",
                "LINK_STATUS=35714",
                "LOW_FLOAT=36336",
                "LOW_INT=36339",
                "LUMINANCE=6409",
                "LUMINANCE_ALPHA=6410",
                "MAX_COMBINED_TEXTURE_IMAGE_UNITS=35661=32",
                "MAX_CUBE_MAP_TEXTURE_SIZE=34076=16384",
                "MAX_FRAGMENT_UNIFORM_VECTORS=36349=1024",
                "MAX_RENDERBUFFER_SIZE=34024=16384",
                "MAX_TEXTURE_IMAGE_UNITS=34930=16",
                "MAX_TEXTURE_SIZE=3379=16384",
                "MAX_VARYING_VECTORS=36348=30",
                "MAX_VERTEX_ATTRIBS=34921=16",
                "MAX_VERTEX_TEXTURE_IMAGE_UNITS=35660=16",
                "MAX_VERTEX_UNIFORM_VECTORS=36347=4096",
                "MAX_VIEWPORT_DIMS=3386=32767,32767",
                "MEDIUM_FLOAT=36337",
                "MEDIUM_INT=36340",
                "MIRRORED_REPEAT=33648",
                "NEAREST=9728",
                "NEAREST_MIPMAP_LINEAR=9986",
                "NEAREST_MIPMAP_NEAREST=9984",
                "NEVER=512",
                "NICEST=4354",
                "NONE=0",
                "NOTEQUAL=517",
                "NO_ERROR=0",
                "ONE=1",
                "ONE_MINUS_CONSTANT_ALPHA=32772",
                "ONE_MINUS_CONSTANT_COLOR=32770",
                "ONE_MINUS_DST_ALPHA=773",
                "ONE_MINUS_DST_COLOR=775",
                "ONE_MINUS_SRC_ALPHA=771",
                "ONE_MINUS_SRC_COLOR=769",
                "OUT_OF_MEMORY=1285",
                "PACK_ALIGNMENT=3333=4",
                "POINTS=0",
                "POLYGON_OFFSET_FACTOR=32824=0",
                "POLYGON_OFFSET_FILL=32823=false",
                "POLYGON_OFFSET_UNITS=10752=0",
                "RED_BITS=3410=8",
                "RENDERBUFFER=36161",
                "RENDERBUFFER_ALPHA_SIZE=36179",
                "RENDERBUFFER_BINDING=36007",
                "RENDERBUFFER_BLUE_SIZE=36178",
                "RENDERBUFFER_DEPTH_SIZE=36180",
                "RENDERBUFFER_GREEN_SIZE=36177",
                "RENDERBUFFER_HEIGHT=36163",
                "RENDERBUFFER_INTERNAL_FORMAT=36164",
                "RENDERBUFFER_RED_SIZE=36176",
                "RENDERBUFFER_STENCIL_SIZE=36181",
                "RENDERBUFFER_WIDTH=36162",
                "RENDERER=7937=WebKit WebGL",
                "REPEAT=10497",
                "REPLACE=7681",
                "RGB565=36194",
                "RGB5_A1=32855",
                "RGB8=32849",
                "RGB=6407",
                "RGBA4=32854",
                "RGBA8=32856",
                "RGBA=6408",
                "SAMPLER_2D=35678",
                "SAMPLER_CUBE=35680",
                "SAMPLES=32937=4",
                "SAMPLE_ALPHA_TO_COVERAGE=32926",
                "SAMPLE_BUFFERS=32936=1",
                "SAMPLE_COVERAGE=32928",
                "SAMPLE_COVERAGE_INVERT=32939=false",
                "SAMPLE_COVERAGE_VALUE=32938=1",
                "SCISSOR_BOX=3088=0,0,300,150",
                "SCISSOR_TEST=3089=false",
                "SHADER_TYPE=35663",
                "SHADING_LANGUAGE_VERSION=35724=WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)",
                "SHORT=5122",
                "SRC_ALPHA=770",
                "SRC_ALPHA_SATURATE=776",
                "SRC_COLOR=768",
                "STATIC_DRAW=35044",
                "STENCIL_ATTACHMENT=36128",
                "STENCIL_BACK_FAIL=34817=7680",
                "STENCIL_BACK_FUNC=34816=519",
                "STENCIL_BACK_PASS_DEPTH_FAIL=34818=7680",
                "STENCIL_BACK_PASS_DEPTH_PASS=34819=7680",
                "STENCIL_BACK_REF=36003=0",
                "STENCIL_BACK_VALUE_MASK=36004=2147483647",
                "STENCIL_BACK_WRITEMASK=36005=2147483647",
                "STENCIL_BITS=3415=0",
                "STENCIL_BUFFER_BIT=1024",
                "STENCIL_CLEAR_VALUE=2961=0",
                "STENCIL_FAIL=2964=7680",
                "STENCIL_FUNC=2962=519",
                "STENCIL_INDEX8=36168",
                "STENCIL_PASS_DEPTH_FAIL=2965=7680",
                "STENCIL_PASS_DEPTH_PASS=2966=7680",
                "STENCIL_REF=2967=0",
                "STENCIL_TEST=2960=false",
                "STENCIL_VALUE_MASK=2963=2147483647",
                "STENCIL_WRITEMASK=2968=2147483647",
                "STREAM_DRAW=35040",
                "SUBPIXEL_BITS=3408=4",
                "TEXTURE0=33984",
                "TEXTURE10=33994",
                "TEXTURE11=33995",
                "TEXTURE12=33996",
                "TEXTURE13=33997",
                "TEXTURE14=33998",
                "TEXTURE15=33999",
                "TEXTURE16=34000",
                "TEXTURE17=34001",
                "TEXTURE18=34002",
                "TEXTURE19=34003",
                "TEXTURE1=33985",
                "TEXTURE20=34004",
                "TEXTURE21=34005",
                "TEXTURE22=34006",
                "TEXTURE23=34007",
                "TEXTURE24=34008",
                "TEXTURE25=34009",
                "TEXTURE26=34010",
                "TEXTURE27=34011",
                "TEXTURE28=34012",
                "TEXTURE29=34013",
                "TEXTURE2=33986",
                "TEXTURE30=34014",
                "TEXTURE31=34015",
                "TEXTURE3=33987",
                "TEXTURE4=33988",
                "TEXTURE5=33989",
                "TEXTURE6=33990",
                "TEXTURE7=33991",
                "TEXTURE8=33992",
                "TEXTURE9=33993",
                "TEXTURE=5890",
                "TEXTURE_2D=3553",
                "TEXTURE_BINDING_2D=32873",
                "TEXTURE_BINDING_CUBE_MAP=34068",
                "TEXTURE_CUBE_MAP=34067",
                "TEXTURE_CUBE_MAP_NEGATIVE_X=34070",
                "TEXTURE_CUBE_MAP_NEGATIVE_Y=34072",
                "TEXTURE_CUBE_MAP_NEGATIVE_Z=34074",
                "TEXTURE_CUBE_MAP_POSITIVE_X=34069",
                "TEXTURE_CUBE_MAP_POSITIVE_Y=34071",
                "TEXTURE_CUBE_MAP_POSITIVE_Z=34073",
                "TEXTURE_MAG_FILTER=10240",
                "TEXTURE_MIN_FILTER=10241",
                "TEXTURE_WRAP_S=10242",
                "TEXTURE_WRAP_T=10243",
                "TRIANGLES=4",
                "TRIANGLE_FAN=6",
                "TRIANGLE_STRIP=5",
                "UNPACK_ALIGNMENT=3317=4",
                "UNPACK_COLORSPACE_CONVERSION_WEBGL=37443=37444",
                "UNPACK_FLIP_Y_WEBGL=37440=false",
                "UNPACK_PREMULTIPLY_ALPHA_WEBGL=37441=false",
                "UNSIGNED_BYTE=5121",
                "UNSIGNED_INT=5125",
                "UNSIGNED_SHORT=5123",
                "UNSIGNED_SHORT_4_4_4_4=32819",
                "UNSIGNED_SHORT_5_5_5_1=32820",
                "UNSIGNED_SHORT_5_6_5=33635",
                "VALIDATE_STATUS=35715",
                "VENDOR=7936=WebKit",
                "VERSION=7938=WebGL 1.0 (OpenGL ES 2.0 Chromium)",
                "VERTEX_ATTRIB_ARRAY_BUFFER_BINDING=34975",
                "VERTEX_ATTRIB_ARRAY_ENABLED=34338",
                "VERTEX_ATTRIB_ARRAY_NORMALIZED=34922",
                "VERTEX_ATTRIB_ARRAY_POINTER=34373",
                "VERTEX_ATTRIB_ARRAY_SIZE=34339",
                "VERTEX_ATTRIB_ARRAY_STRIDE=34340",
                "VERTEX_ATTRIB_ARRAY_TYPE=34341",
                "VERTEX_SHADER=35633",
                "VIEWPORT=2978=0,0,300,150",
                "ZERO=0"
            ],
            "shaderPrecisions": [
                "FRAGMENT_SHADER.LOW_FLOAT=127,127,23",
                "FRAGMENT_SHADER.MEDIUM_FLOAT=127,127,23",
                "FRAGMENT_SHADER.HIGH_FLOAT=127,127,23",
                "FRAGMENT_SHADER.LOW_INT=31,30,0",
                "FRAGMENT_SHADER.MEDIUM_INT=31,30,0",
                "FRAGMENT_SHADER.HIGH_INT=31,30,0",
                "VERTEX_SHADER.LOW_FLOAT=127,127,23",
                "VERTEX_SHADER.MEDIUM_FLOAT=127,127,23",
                "VERTEX_SHADER.HIGH_FLOAT=127,127,23",
                "VERTEX_SHADER.LOW_INT=31,30,0",
                "VERTEX_SHADER.MEDIUM_INT=31,30,0",
                "VERTEX_SHADER.HIGH_INT=31,30,0"
            ],
            "extensions": [
                "ANGLE_instanced_arrays",
                "EXT_blend_minmax",
                "EXT_clip_control",
                "EXT_color_buffer_half_float",
                "EXT_depth_clamp",
                "EXT_disjoint_timer_query",
                "EXT_float_blend",
                "EXT_frag_depth",
                "EXT_polygon_offset_clamp",
                "EXT_shader_texture_lod",
                "EXT_texture_compression_bptc",
                "EXT_texture_compression_rgtc",
                "EXT_texture_filter_anisotropic",
                "EXT_texture_mirror_clamp_to_edge",
                "EXT_sRGB",
                "KHR_parallel_shader_compile",
                "OES_element_index_uint",
                "OES_fbo_render_mipmap",
                "OES_standard_derivatives",
                "OES_texture_float",
                "OES_texture_float_linear",
                "OES_texture_half_float",
                "OES_texture_half_float_linear",
                "OES_vertex_array_object",
                "WEBGL_blend_func_extended",
                "WEBGL_color_buffer_float",
                "WEBGL_compressed_texture_s3tc",
                "WEBGL_compressed_texture_s3tc_srgb",
                "WEBGL_debug_renderer_info",
                "WEBGL_debug_shaders",
                "WEBGL_depth_texture",
                "WEBGL_draw_buffers",
                "WEBGL_lose_context",
                "WEBGL_multi_draw",
                "WEBGL_polygon_mode"
            ],
            "extensionParameters": [
                "CLIP_DEPTH_MODE_EXT=37725",
                "CLIP_ORIGIN_EXT=37724",
                "COLOR_ATTACHMENT0_WEBGL=36064",
                "COLOR_ATTACHMENT10_WEBGL=36074",
                "COLOR_ATTACHMENT11_WEBGL=36075",
                "COLOR_ATTACHMENT12_WEBGL=36076",
                "COLOR_ATTACHMENT13_WEBGL=36077",
                "COLOR_ATTACHMENT14_WEBGL=36078",
                "COLOR_ATTACHMENT15_WEBGL=36079",
                "COLOR_ATTACHMENT1_WEBGL=36065",
                "COLOR_ATTACHMENT2_WEBGL=36066",
                "COLOR_ATTACHMENT3_WEBGL=36067",
                "COLOR_ATTACHMENT4_WEBGL=36068",
                "COLOR_ATTACHMENT5_WEBGL=36069",
                "COLOR_ATTACHMENT6_WEBGL=36070",
                "COLOR_ATTACHMENT7_WEBGL=36071",
                "COLOR_ATTACHMENT8_WEBGL=36072",
                "COLOR_ATTACHMENT9_WEBGL=36073",
                "COMPLETION_STATUS_KHR=37297",
                "COMPRESSED_RED_GREEN_RGTC2_EXT=36285",
                "COMPRESSED_RED_RGTC1_EXT=36283",
                "COMPRESSED_RGBA_BPTC_UNORM_EXT=36492",
                "COMPRESSED_RGBA_S3TC_DXT1_EXT=33777",
                "COMPRESSED_RGBA_S3TC_DXT3_EXT=33778",
                "COMPRESSED_RGBA_S3TC_DXT5_EXT=33779",
                "COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT=36494",
                "COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT=36495",
                "COMPRESSED_RGB_S3TC_DXT1_EXT=33776",
                "COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT=36286",
                "COMPRESSED_SIGNED_RED_RGTC1_EXT=36284",
                "COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT=36493",
                "COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT=35917",
                "COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT=35918",
                "COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT=35919",
                "COMPRESSED_SRGB_S3TC_DXT1_EXT=35916",
                "CURRENT_QUERY_EXT=34917",
                "DEPTH_CLAMP_EXT=34383",
                "DRAW_BUFFER0_WEBGL=34853=1029",
                "DRAW_BUFFER10_WEBGL=34863",
                "DRAW_BUFFER11_WEBGL=34864",
                "DRAW_BUFFER12_WEBGL=34865",
                "DRAW_BUFFER13_WEBGL=34866",
                "DRAW_BUFFER14_WEBGL=34867",
                "DRAW_BUFFER15_WEBGL=34868",
                "DRAW_BUFFER1_WEBGL=34854=1029",
                "DRAW_BUFFER2_WEBGL=34855",
                "DRAW_BUFFER3_WEBGL=34856",
                "DRAW_BUFFER4_WEBGL=34857",
                "DRAW_BUFFER5_WEBGL=34858",
                "DRAW_BUFFER6_WEBGL=34859",
                "DRAW_BUFFER7_WEBGL=34860",
                "DRAW_BUFFER8_WEBGL=34861",
                "DRAW_BUFFER9_WEBGL=34862",
                "FRAGMENT_SHADER_DERIVATIVE_HINT_OES=35723=4352",
                "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT=33296",
                "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT=33297",
                "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT=33297",
                "GPU_DISJOINT_EXT=36795=false",
                "HALF_FLOAT_OES=36193",
                "LOWER_LEFT_EXT=36001",
                "MAX_COLOR_ATTACHMENTS_WEBGL=36063=8",
                "MAX_DRAW_BUFFERS_WEBGL=34852=8",
                "MAX_DUAL_SOURCE_DRAW_BUFFERS_WEBGL=35068",
                "MAX_EXT=32776",
                "MAX_TEXTURE_MAX_ANISOTROPY_EXT=34047=16",
                "MIN_EXT=32775",
                "MIRROR_CLAMP_TO_EDGE_EXT=34627",
                "NEGATIVE_ONE_TO_ONE_EXT=37726",
                "ONE_MINUS_SRC1_ALPHA_WEBGL=35067",
                "ONE_MINUS_SRC1_COLOR_WEBGL=35066",
                "POLYGON_OFFSET_CLAMP_EXT=36379",
                "QUERY_COUNTER_BITS_EXT=34916",
                "QUERY_RESULT_AVAILABLE_EXT=34919",
                "QUERY_RESULT_EXT=34918",
                "RGB16F_EXT=34843",
                "RGBA16F_EXT=34842",
                "RGBA32F_EXT=34836",
                "SRC1_ALPHA_WEBGL=34185",
                "SRC1_COLOR_WEBGL=35065",
                "SRGB8_ALPHA8_EXT=35907",
                "SRGB_ALPHA_EXT=35906",
                "SRGB_EXT=35904",
                "TEXTURE_MAX_ANISOTROPY_EXT=34046",
                "TIMESTAMP_EXT=36392=0",
                "TIME_ELAPSED_EXT=35007",
                "UNMASKED_RENDERER_WEBGL=37446",
                "UNMASKED_VENDOR_WEBGL=37445",
                "UNSIGNED_INT_24_8_WEBGL=34042",
                "UNSIGNED_NORMALIZED_EXT=35863",
                "UNSIGNED_NORMALIZED_EXT=35863",
                "UPPER_LEFT_EXT=36002",
                "VERTEX_ARRAY_BINDING_OES=34229=null",
                "VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE=35070",
                "ZERO_TO_ONE_EXT=37727"
            ],
            "unsupportedExtensions": []
        },
        "duration": 67
    }
}


async function get_waf(url, method, headers) {
    let resp = await axios.request({
        url: url,
        method: method || 'get',
        headers: headers || {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
        }
    }).catch((err) => err.response);
    let client_id = resp.data.match(/[0-9a-fA-F]{32}_[0-9a-zA-Z]+/g)[0]
    let level = resp.data.match(/level: ".*?"/g)[0].replace('level: ', '').replace(/"/g, '')
    console.log(client_id, level);
    let json = (await axios.request({
        url: "https://challenge.rivers.chaitin.cn/challenge/v2/api/issue",
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        data: JSON.stringify({
            "client_id": client_id,
            "level": Number(level)
        })
    })).data

    function u(e, t) {
        return ({
            status: "finish",
            issue_id: t.issue_id,
            result: e(t.data)
        })
    }

    let t = await WebAssembly.instantiateStreaming(_fetch('https://challenge.rivers.chaitin.cn/challenge/v2/calc.wasm'), {})
    let n = {};
    n.data = (u(function (e) {
        return t.instance.exports.reset(),
            e.map(function (e) {
                return t.instance.exports.arg(e)
            }),
            Array(t.instance.exports.calc()).fill(-1).map(function () {
                return t.instance.exports.ret()
            })
    }, json.data))
    let visitorId = eE(e);
    let verify = (await axios.request({
        url: "https://challenge.rivers.chaitin.cn/challenge/v2/api/verify",
        method: "post",
        headers: {
            "Referer": url,
            "Content-Type": "application/json",
        },
        data: JSON.stringify({
            issue_id: n.data.issue_id,
            result: n.data.result,
            serials: [],
            client: {
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "platform": "Win32",
                "language": "zh-CN,zh",
                "vendor": "Google Inc.",
                "screen": [
                    1536,
                    864
                ],
                "visitorId": visitorId,
                "score": 0,
                "target": []
            }
        })
    })).data
    let final = await axios.request({
        url: url,
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
            "Referer": url,
            "Cookie": "sl-challenge-jwt=".concat(verify.data.jwt)

        },
    })
    return final.headers['set-cookie'].map(it => it.replace(/;.*/, "")).join(";")
}


$.exports = {
    get_waf
}
