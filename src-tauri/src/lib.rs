use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            if let Some(main_window) = app.get_webview_window("main") {
                #[cfg(target_os = "linux")]
                {
                    use gtk::prelude::*;
                    use webkit2gtk::WebViewExt;

                    let win = main_window.clone();
                    let _ = main_window.with_webview(move |webview| {
                        let wv = webview.inner();

                        // Ensure touchpad gestures are permitted through GDK
                        wv.add_events(gdk::EventMask::TOUCHPAD_GESTURE_MASK);

                        let last_gesture_time = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));
                        let last_gesture_time_notify = last_gesture_time.clone();
                        let win_notify = win.clone();

                        // Force webview zoom level to remain 1.0 to prevent native page enlargement
                        wv.connect_zoom_level_notify(move |v| {
                            let current_zoom = v.zoom_level();
                            if (current_zoom - 1.0).abs() > 0.001 {
                                v.set_zoom_level(1.0);
                                let now = std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_millis() as u64;
                                let last_time = last_gesture_time_notify.load(std::sync::atomic::Ordering::Relaxed);
                                if now.saturating_sub(last_time) > 150 {
                                    let _ = win_notify.eval(&format!(
                                        "window.dispatchEvent(new CustomEvent('tauri-pinch-zoom-change', {{ detail: {{ scale: {}, isLevelDelta: true }} }}));",
                                        current_zoom
                                    ));
                                }
                            }
                        });

                        let zoom_gesture = gtk::GestureZoom::new(&wv);
                        zoom_gesture.set_propagation_phase(gtk::PropagationPhase::Capture);

                        let win_begin = win.clone();
                        zoom_gesture.connect_begin(move |gesture, _sequence| {
                            gesture.set_state(gtk::EventSequenceState::Claimed);
                            let center = gesture.bounding_box_center();
                            let center_js = match center {
                                Some((x, y)) => format!("x: {}, y: {}", x, y),
                                None => "x: null, y: null".to_string(),
                            };
                            let _ = win_begin.eval(&format!(
                                "window.dispatchEvent(new CustomEvent('tauri-pinch-zoom-start', {{ detail: {{ {} }} }}));",
                                center_js
                            ));
                        });

                        let win_scale = win.clone();
                        let last_gesture_time_scale = last_gesture_time.clone();
                        zoom_gesture.connect_scale_changed(move |gesture, scale| {
                            gesture.set_state(gtk::EventSequenceState::Claimed);
                            let now = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64;
                            last_gesture_time_scale.store(now, std::sync::atomic::Ordering::Relaxed);

                            let center = gesture.bounding_box_center();
                            let center_js = match center {
                                Some((x, y)) => format!("x: {}, y: {}", x, y),
                                None => "x: null, y: null".to_string(),
                            };
                            let _ = win_scale.eval(&format!(
                                "window.dispatchEvent(new CustomEvent('tauri-pinch-zoom-change', {{ detail: {{ scale: {}, {} }} }}));",
                                scale, center_js
                            ));
                        });

                        let win_end = win.clone();
                        zoom_gesture.connect_end(move |_gesture, _sequence| {
                            let _ = win_end.eval("window.dispatchEvent(new CustomEvent('tauri-pinch-zoom-end'));");
                        });

                        // Keep controller alive with the widget
                        unsafe {
                            wv.set_data("od_lagna_zoom_gesture", zoom_gesture);
                        }
                    });
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
