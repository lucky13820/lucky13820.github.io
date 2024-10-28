var countdown = function(d) {
    "use strict";
    class M {
        constructor() {
            this.data = {}
        }
        set(o, s) {
            this.data[o] = s
        }
        get(o) {
            return this.data[o]
        }
    }
    const B = {
        Booster: class {
            constructor(o) {
                this.options = o
            }
            log(o, s) {
                const e = `
      display: inline-block;
      padding: 4px 6px;
      border-radius: 4px;
      line-height: 1.5em;
      color: #282735;
      background: linear-gradient(45deg,
        rgba(185, 205, 255, 0.4) 0%,
        rgba(201, 182, 255, 0.4) 33%,
        rgba(239, 184, 255, 0.4) 66%,
        rgba(255, 210, 177, 0.4) 100%);
        `,
                    i = [`%c[${this.options.title}] ${o}. Link to documentation ${this.options.documentationLink}`, e];
                s ? (console.group(...i), Array.isArray(s) ? console.log(...s) : console.log(s), console.groupEnd()) : console.log(...i)
            }
            validate(o, s, e) {
                if (!o.validate) return !0;
                if (typeof o.validate == "function") {
                    if (!o.validate(e)) return this.log(`Invalid value "${e}" for attribute "${s}"`), !1
                } else if (!o.validate.includes(e)) return this.log(`Invalid value "${e}" for attribute "${s}"`, [`%cPossible values:%c
` + o.validate.map(i => `• ${i}`).join(`
`), "font-weight: 700;", "font-weight: initial;"]), !1;
                return !0
            }
            parse(o) {
                const s = new M;
                for (const e in this.options.attributes) {
                    const i = this.options.attributes[e],
                        r = o.getAttribute(e);
                    if (!r) {
                        s.set(e, i.defaultValue);
                        continue
                    }
                    if (!this.validate(i, e, r)) continue;
                    let n = r;
                    i.parse && (n = i.parse(r) ?? i.defaultValue), s.set(e, n)
                }
                this.options.apply.call(this, o, s)
            }
            getElements() {
                return document.querySelectorAll(`[${this.options.name}]`)
            }
            init() {
                this.getElements().forEach(s => this.parse(s))
            }
        },
        validation: {
            isNumber: t => !isNaN(Number(t))
        }
    },
        m = t => {
            if (!t) return !1;
            const o = new Date(t);
            return !isNaN(o.valueOf())
        };
    var u = (t => (t.Weeks = "weeks", t.Days = "days", t.Hours = "hours", t.Minutes = "minutes", t.Seconds = "seconds", t))(u || {});
    const y = 1e3,
        h = y * 60,
        f = h * 60,
        p = f * 24,
        v = p * 7,
        b = {
            Countdown: class {
                constructor(o, s) {
                    if (this.options = s, !o) throw new Error("Please provide the target date");
                    if (!m(o)) throw new Error("Invalid date format");
                    this.targetDate = new Date(o).getTime(), this.values = [{
                        unit: u.Weeks,
                        value: 0,
                        shift: 0,
                        skip: !s.weeks,
                        calc: e => Math.floor(e / v)
                    }, {
                        unit: u.Days,
                        value: 0,
                        shift: 7,
                        skip: !s.days,
                        calc: e => Math.floor(e % v / p)
                    }, {
                        unit: u.Hours,
                        value: 0,
                        shift: 24,
                        skip: !s.hours,
                        calc: e => Math.floor(e % p / f)
                    }, {
                        unit: u.Minutes,
                        value: 0,
                        shift: 60,
                        skip: !s.minutes,
                        calc: e => Math.floor(e % f / h)
                    }, {
                        unit: u.Seconds,
                        value: 0,
                        shift: 60,
                        skip: !s.seconds,
                        calc: e => Math.floor(e % h / y)
                    }]
                }
                get intervalTimeout() {
                    switch (!0) {
                        case this.options.seconds:
                        default:
                            return y;
                        case this.options.minutes:
                            return h;
                        case this.options.hours:
                            return f;
                        case this.options.days:
                            return p;
                        case this.options.weeks:
                            return v
                    }
                }
                updateValues() {
                    if (!this.targetDate) return;
                    const o = new Date().getTime(),
                        s = this.targetDate - o,
                        e = {};
                    this.values.forEach((i, r) => {
                        if (s > 0) {
                            i.value = i.calc(s);
                            const n = this.values[r - 1];
                            n != null && n.skip && (i.value += n.value * i.shift)
                        }
                        i.skip || (e[i.unit] = i.value)
                    }), this.options.onUpdate(e), s <= this.intervalTimeout && (this.stop(), this.options.onComplete && this.options.onComplete())
                }
                start() {
                    this.intervalId || (this.updateValues(), this.intervalId = setInterval(() => {
                        this.updateValues()
                    }, this.intervalTimeout))
                }
                stop() {
                    clearInterval(this.intervalId), this.intervalId = void 0
                }
            },
            validation: {
                isValidDate: m
            }
        };
    var a = (t => (t.Root = "fb-countdown", t.Target = "fb-countdown-target", t.Type = "fb-countdown-type", t.Finish = "fb-countdown-finish", t))(a || {}),
        l = (t => (t.Weeks = "weeks", t.Days = "days", t.Hours = "hours", t.Minutes = "minutes", t.Seconds = "seconds", t))(l || {});
    const I = new B.Booster({
        name: a.Root,
        attributes: {
            [a.Target]: {
                defaultValue: "",
                validate: b.validation.isValidDate
            }
        },
        apply(t, o) {
            const s = o.get(a.Target);
            if (!s) return;
            const e = t.querySelector(`[${a.Type}=${l.Weeks}]`),
                i = t.querySelector(`[${a.Type}=${l.Days}]`),
                r = t.querySelector(`[${a.Type}=${l.Hours}]`),
                n = t.querySelector(`[${a.Type}=${l.Minutes}]`),
                g = t.querySelector(`[${a.Type}=${l.Seconds}]`);
            if (!e && !i && !r && !n && !g) return this.log("Required attribute is missing");
            const w = t.querySelector(`[${a.Finish}]`);
            w && (w.style.display = "none"), new b.Countdown(s, {
                weeks: !!e,
                days: !!i,
                hours: !!r,
                minutes: !!n,
                seconds: !!g,
                onUpdate(c) {
                    const padZero = (num) => num.toString().padStart(2, '0');
                    
                    if (e) e.textContent = (c.weeks ?? 0).toString(); // Weeks remain single digit
                    if (i) i.textContent = padZero(c.days ?? 0);
                    if (r) r.textContent = padZero(c.hours ?? 0);
                    if (n) n.textContent = padZero(c.minutes ?? 0);
                    if (g) g.textContent = padZero(c.seconds ?? 0);
                },
                onComplete() {
                    w && (w.style.display = "block")
                }
            }).start()
        },
        title: "Countdown Booster",
        documentationLink: "https://www.flowbase.co/booster/countdown"
    }),
        k = () => I.init();
    return document.readyState === "complete" ? k() : window.addEventListener("load", k), d.CountdownAttrNames = a, d.CountdownType = l, Object.defineProperty(d, Symbol.toStringTag, {
        value: "Module"
    }), d
}({});
