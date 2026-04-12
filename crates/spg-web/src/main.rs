#[tokio::main]
async fn main() -> anyhow::Result<()> {
    spg_web::run().await
}
