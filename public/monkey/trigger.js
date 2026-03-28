
(function(o) {

    function doconnect() {
        g_gmain.g_delay_connect = 0;
        connectServer();
        $("span.out2:contains(有人取代了)").remove();
        console.log("道长论剑本服重连成功")
    }

    function ds_connect() {
        if (btnList['定时重连'].innerText == '定时重连') {
            database.ds_cntm = prompt('请设置定时重连时间间隔(分钟)', database.ds_cntm);
            if (database.ds_cntm) {
                clearInterval(ds_cnjs);
                ds_cnjs = setInterval(function() {
                    g_gmain.g_delay_connect = 0;
                    connectServer();
                    $("span.out2:contains(有人取代了)").remove()
                }, parseInt(database.ds_cntm) * 1000 * 60);
                btnList['定时重连'].innerText = '关闭重连';
                btnList['定时重连'].style.borderStyle = 'inset';
                database.ds_cnflag = 1
            } else {
                console.log('参悟错误或者取消了设置');
                return
            }
        } else {
            database.ds_cnflag = 0;
            btnList['定时重连'].innerText = '定时重连';
            btnList['定时重连'].style.borderStyle = 'outset';
            clearInterval(ds_cnjs)
        }
    }
    function ds_cnre() {
        if (typeof database.ds_cntm == 'undefined' || database.ds_cntm == 'null') {
            database.ds_cntm = 15
        }
        if (typeof database.ds_cnflag == 'undefined' || database.ds_cnflag == 'null') {
            database.ds_cnflag = 0
        }
        if (database.ds_cnflag == 1) {
            clearInterval(ds_cnjs);
            ds_cnjs = setInterval(function() {
                g_gmain.g_delay_connect = 0;
                connectServer();
                $("span.out2:contains(有人取代了)").remove()
            }, parseInt(database.ds_cntm) * 1000 * 60);
            btnList['定时重连'].innerText = '关闭重连';
            btnList['定时重连'].style.borderStyle = 'inset'
        } else if (database.ds_cnflag == 0) {
            btnList['定时重连'].innerText = '定时重连';
            btnList['定时重连'].style.borderStyle = 'outset';
            clearInterval(ds_cnjs)
        }
    }

    function Autoreconnect() {
        this.dispatchMessage = function(b) {
            var a = b.get("type"),
                msg = b.get("subtype");
            if (a == "disconnect" && msg == "change") {
                g_gmain.g_delay_connect = 0;
                connectServer()
            }
        }
    }
    var bF = new Autoreconnect();

    function Trigger(r, h, c, n) {
        this.regexp = r;
        this.handler = h;
        this.class = c;
        this.name = n;
        this.enabled = true;
        this.trigger = function(a) {
            if (!this.enabled) return;
            if (!this.regexp.test(a)) return;
            var m = a.match(this.regexp);
            this.handler(m)
        };
        this.enable = function() {
            this.enabled = true
        };
        this.disable = function() {
            this.enabled = false
        }
    }

    function Triggers() {
        this.allTriggers = [];
        this.trigger = function(a) {
            var t = this.allTriggers.slice(0);
            for (var i = 0, l = t.length; i < l; i++) {
                t[i].trigger(a)
            }
        }
        this.newTrigger = function(r, h, c, n) {
            var t = new Trigger(r, h, c, n);
            if (n) {
                for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                    if (this.allTriggers[i].name == n) this.allTriggers.splice(i, 1)
                }
            }
            this.allTriggers.push(t);
            return t
        }
        this.enableTriggerByName = function(n) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.name == n) t.enable()
            }
        }
        this.disableTriggerByName = function(n) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.name == n) t.disable()
            }
        }
        this.enableByCls = function(c) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.class == c) t.enable()
            }
        }
        this.disableByCls = function(c) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.class == c) t.disable()
            }
        }
        this.removeByCls = function(c) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t && t.class == c) this.allTriggers.splice(i, 1)
            }
        }
        this.removeByName = function(n) {
            for (var i = this.allTriggers.length - 1; i >= 0; i--) {
                t = this.allTriggers[i];
                if (t.name == n) this.allTriggers.splice(i, 1)
            }
        }
    }

    o.triggers = new Triggers();

    o.game = this;
    o.attach = function() {
        var c = o.writeToScreen;
        o.writeToScreen = function(a, e, f, g) {
            c(a, e, f, g);
            a = a.replace(/<[^>]*>/g, "");
            triggers.trigger(a)
        };
        webSocketMsg.prototype.old = gSocketMsg.dispatchMessage;
        gSocketMsg.dispatchMessage = function(b) {
            this.old(b);
            bx.dispatchMessage(b);
            if (de == 1) {
                bF.dispatchMessage(b)
            }
            if (bQ == 1) {
                bE.dispatchMessage(b)
            }
            if (F == 1) {
                G.dispatchMessage(b)
            }
            if (cB == 1) {
                cD.dispatchMessage(b)
            }
            if (bv == 1 || cR == 1 || cS == 1 || cT == 1) {
                cW.dispatchMessage(b)
            }
            if (cJ == 1) {
                cQ.dispatchMessage(b)
            }
            if (cE == 1) {
                cG.dispatchMessage(b)
            }
        }
    };
    attach();

    function opendonpc(s) {
		J = s;
		triggers.enableByCls("donpc")
	}

    triggers.newTrigger(/(.*)看起来(.*)武功看上去/, function(m) {
        triggers.disableByCls("donpc");
        clickbtn(J)
    }, "donpc", "");
    triggers.disableByCls("donpc");

    triggers.newTrigger(/】(.*)【气血】/, function(m) {
        triggers.disableByCls("getname1");
        myName = m[1].replace(' (换称号)', "");
        readmyvip()
    }, "getname1", "");


    function clickbtn1(s) {
        var b = $(".cmd_click2");
        for (var i = 0; i < b.length; i++) {
            if (b[i].innerHTML.replace(/<[^>]+>/g, "").indexOf(s) > -1) {
                b[i].click();
                return
            }
        }
    }
    function clickbtn2(s) {
        var b = document.getElementById('out2').getElementsByTagName('button');
        for (var i = 0; i < b.length; i++) {
            if (b[i].innerHTML.replace(/<[^>]+>/g, "").indexOf(s) > -1) {
                b[i].click();
                return
            }
        }
    }
    function clickbtn3(s) {
        var b = $(".cmd_click3");
        for (var i = 0; i < b.length; i++) {
            if (b[i].innerHTML.replace(/<[^>]+>/g, "").indexOf(s) > -1) {
                b[i].click();
                return
            }
        }
    }

    function getpostion() {
		var a = "商 城排行榜日常任务好 友论 剑帮 派VIP月卡VIP月卡状 态遇剑";
		var b = $('span.outtitle').last().text();
		if ($('span.outbig_text:contains(战斗结束)').length > 0) {
			clickButton('prev_combat');
			setTimeout(getpostion, 500);
			return
		}
		if (is_fighting) {
			E = document.getElementById('vs21').innerText;
			console.log("角色战斗中位置是--" + E)
		} else if (gSocketMsg._is_in_home || a.indexOf(b) != -1 || $('span.out3:contains(潜能)').length > 0) {
			E = "论剑江湖主页";
			g_gmain.notify_fail(HIG + b + "--角色现在位置是--" + E + NOR)
		} else if ($('button.cmd_click_room').length > 0) {
			E = $('button.cmd_click_room')[0].innerText;
			console.log("角色现在位置是--" + E);
			g_gmain.recvNetWork2(HIW + "角色现在位置是--" + E + "\n" + NOR)
		} else if (b) {
			E = $('span.outtitle').last().text();
			g_gmain.notify_fail(HIG + b + "--角色现在位置是--" + E + NOR);
			g_gmain.recvNetWork2(HIW + "角色现在位置是--" + E + "\n" + NOR)
		} else {
			setTimeout(getpostion, 2000);
			console.log("本次未获取到位置，2秒后重新获取")
		}
	}
	function writeouts(b, c, d, e) {
		if ($("span.out2").length != 0) {
			$("#out2").append("<span class='out2' style='color:rgb(255, 60, 60);font-size:13px'>" + b + "   " + "<span style='color:rgb(118, 235, 32)'>" + c + "</span>" + "  " + "<a style='text-decoration:underline;color:cyan' href='javascript:;' onclick=''>" + e + "</a></span>");
			a = document.getElementsByTagName('a');
			for (i = 0; i < a.length; i++) {
				if (a[i].innerText == e) {
					var y = a[i]
				}
			}
			y.onclick = d
		}
	}
	function writeout(a, b) {
		if ($("span.out2").length != 0) {
			$("#out2").append("<br><span class='out2' style='color:" + b + ";font-size:14px'>" + a + "</span>")
		}
	}

    function ql_open() {
		bn = 1;
		database.ql_flag = bn;
		btnList['开青龙'].style.borderStyle = 'inset';
		btnList['开青龙'].innerText = '关青龙';
		triggers.enableByCls("qinglong");
		triggers.enableByCls("wancheng");
		triggers.enableByCls("ql_log")
	}
	function ql_close() {
		bn = 0;
		database.ql_flag = bn;
		btnList['开青龙'].style.borderStyle = 'outset';
		btnList['开青龙'].innerText = '开青龙';
		triggers.disableByCls("qinglong");
		triggers.disableByCls("wancheng");
		triggers.disableByCls("ql_log")
	}

    triggers.newTrigger(/(.*)组织：(.*)正在(.*)施展力量，本会愿出(.*)的战利品奖励给本场战斗的最终获胜者(.*)/, function(m) {
		if (m[1] == "青龙会" && kfql_flag == 0 && m[2].indexOf(quid) == -1) {
			U = m[2];
			qladd = m[3];
			qlthing = m[4];
			href = qladd;
			console.log(U + "--" + qladd + "--" + qlthing)
		}
		if (m[1] == "青龙会" && qlrob.indexOf(m[4]) != -1 && bn == 1 && kfql_flag == 0 && m[2].indexOf(quid) == -1) {
			alertmsg('出现青龙', U + "--" + qladd + "--" + qlthing);
			playwarn();
			nowjob = "ql";
			clickhref(href);
			runhit_close();
			chuzhao_open();
			ql_num = 0;
			triggers.enableByCls("ql_gomap1")
		}
		if (m[1] == "青龙会" && qlrob.indexOf(m[4]) != -1 && bn == 1 && kfql_flag == 1 && m[2].indexOf(quid) > -1) {
			U = m[2];
			qladd = m[3];
			qlthing = m[4];
			href = qladd;
			console.log(U + "--" + qladd + "--" + qlthing);
			alertmsg('出现青龙', U + "--" + qladd + "--" + qlthing);
			playwarn();
			nowjob = "ql";
			clickhref(href);
			runhit_close();
			chuzhao_open();
			ql_num = 0;
			if (quid.indexOf("新") > -1) {
				setTimeout(tell_killqlnpc, ql_delay)
			} else {
				triggers.enableByCls("ql_gomap1")
			}
		}
	}, "qinglong", "");
	triggers.disableByCls("qinglong");

})(window);