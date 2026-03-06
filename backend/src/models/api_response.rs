mod response {
    use serde::Serialize;
    use ts_rs::TS;

    #[derive(Debug, Serialize, TS)]
    #[ts(export)]
    pub struct ApiResponse<T> {
        success: bool,
        data: Option<T>,
        message: Option<String>,
    }

    impl<T> ApiResponse<T> {
        /// Creates a successful response, with `data` and no message.
        pub fn success(data: T) -> Self {
            ApiResponse {
                success: true,
                data: Some(data),
                message: None,
            }
        }

        /// Creates a successful response, with `data` and a message.
        pub fn success_with_message(data: T, message: impl Into<String>) -> Self {
            ApiResponse {
                success: true,
                data: Some(data),
                message: Some(message.into()),
            }
        }

        /// Creates an error response, with `message` and no data.
        pub fn error(message: &str) -> Self {
            ApiResponse {
                success: false,
                data: None,
                message: Some(message.to_string()),
            }
        }
    }
}

// Re-export the type, but its fields remain private
pub use response::ApiResponse;
