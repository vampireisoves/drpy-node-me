package com.quickjs.android.example.js;

import android.content.Context;

import com.caoccao.javet.interop.NodeRuntime;
import com.caoccao.javet.values.V8Value;
import com.caoccao.javet.values.reference.IV8ValuePromise;
import com.caoccao.javet.values.reference.V8ValueArray;
import com.caoccao.javet.values.reference.V8ValueFunction;
import com.caoccao.javet.values.reference.V8ValueObject;
import com.caoccao.javet.values.reference.V8ValuePromise;
import com.quickjs.android.example.LOG;
import com.quickjs.android.example.Spider;
import com.quickjs.android.example.UpdateUaListener;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

public class NodeSpider extends Spider {
    private final String modulePath;
    private final NodeRuntime nodeRuntime;
    private final UpdateUaListener listener;
    ConcurrentHashMap<String, String> queryMap;

    public NodeSpider(String path, NodeRuntime ctx, UpdateUaListener listener) {
        this.modulePath = path;
        this.nodeRuntime = ctx;
        this.listener = listener;
        this.queryMap = new ConcurrentHashMap<>();
    }

    private void func(Object... args) {
        try {
            V8ValueFunction v8ValueFunction = nodeRuntime.getGlobalObject().get("getEngine");
            Object result = v8ValueFunction.call(null, args);
            if (result instanceof V8ValueObject) {
                if (result instanceof V8ValuePromise) {
                    V8ValuePromise v8ValuePromise = ((V8ValuePromise) result);
                    v8ValuePromise.register(new IV8ValuePromise.IListener() {
                        @Override
                        public void onCatch(V8Value v8Value) {
                            //listener.saved(((V8ValueObject) v8Value).toJsonString());
                        }

                        @Override
                        public void onFulfilled(V8Value v8Value) {
                            listener.saved(((V8ValueObject) v8Value).toJsonString());
                        }

                        @Override
                        public void onRejected(V8Value v8Value) {
                            //listener.saved(((V8ValueObject) v8Value).toJsonString());
                        }
                    });
                } else {
                    listener.saved(((V8ValueObject) result).toJsonString());
                }
            } else {
                listener.saved(result.toString());
            }
        } catch (Throwable throwable) {
            LOG.e(throwable);
        }
    }

    @Override
    public void init(Context context) throws Exception {
        super.init(context);
    }

    @Override
    public void init(Context context, String extend) throws Exception {
        super.init(context, extend);
        try {
            String go = "ds";
            boolean refresh = false;
            if (extend.startsWith("{")) {
                JSONObject json = new JSONObject(extend);
                extend = json.optString("extend", "");
                go = json.optString("go", "ds");
                refresh = json.optBoolean("refresh", false);
            }
            queryMap.put("go", go);
            if(refresh) queryMap.put("refresh", "");
            queryMap.put("extend", extend);
        } catch (Throwable throwable) {
            LOG.e(throwable);
        }
    }

    @Override
    public String categoryContent(String tid, String pg, boolean filter, HashMap<String, String> extend) {
        try {
            V8ValueObject ext = nodeRuntime.createV8ValueObject();
            if (extend != null) {
                for (String s : extend.keySet()) {
                    ext.set(s, extend.get(s));
                }
            }
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            query.set("ac", "category");
            query.set("t", tid);
            query.set("pg", pg);
            query.set("ext", ext);
            func(modulePath, query);
            return "";
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
    }

    @Override
    public String detailContent(List<String> list) {
        try {
            V8ValueArray array = nodeRuntime.createV8ValueArray();
            if (list != null) {
                for (int i = 0; i < list.size(); i++) {
                    array.push(list.get(i));
                }
            }
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            query.set("ac", "detail");
            query.set("ids", array);
            func(modulePath, query);
            return "";
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
    }

    @Override
    public String homeContent(boolean filter) {
        try {
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            query.set("filter", filter);
            func(modulePath, query);
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
        return "";
    }

    @Override
    public String homeVideoContent() {
        try {
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            func(modulePath, query);
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
        return "";
    }

    @Override
    public String playerContent(String flag, String id, List<String> vipFlags) {
        try {
            V8ValueArray array = nodeRuntime.createV8ValueArray();
            if (vipFlags != null) {
                for (int i = 0; i < vipFlags.size(); i++) {
                    array.push(vipFlags.get(i));
                }
            }
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            query.set("play", id);
            query.set("flag", flag);
            func(modulePath, query);
            return "";
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
    }

    @Override
    public String searchContent(String key, boolean quick) {
        try {
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            query.set("wd", key);
            query.set("quick", quick);
            func(modulePath, query);
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
        return "";
    }

    @Override
    public String searchContent(String key, boolean quick, String pg) {
        try {
            V8ValueObject query = nodeRuntime.createV8ValueObject();
            if (queryMap != null) {
                for (String s : queryMap.keySet()) {
                    query.set(s, queryMap.get(s));
                }
            }
            query.set("wd", key);
            query.set("quick", quick);
            query.set("pg", pg);
            func(modulePath, query);
        } catch (Throwable throwable) {
            LOG.e(throwable);
            return "";
        }
        return "";
    }
}
