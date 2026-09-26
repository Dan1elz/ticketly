from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações lidas das variáveis de ambiente (o compose injeta o .env)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "ticketly-voucher"
    log_level: str = "INFO"

    # RabbitMQ: consome order.paid, publica ticket.generated
    rabbitmq_url: str = "amqp://ticketly:ticketly@rabbitmq:5672/"
    rabbitmq_exchange: str = "ticketly.events"
    rabbitmq_queue: str = "voucher.order-paid"

    # Redis: idempotência (processed:{messageId})
    redis_url: str = "redis://redis:6379/0"

    # MinIO (S3)
    s3_endpoint_url: str = "http://minio:9000"
    s3_access_key: str = "ticketly"
    s3_secret_key: str = "ticketly-secret"
    s3_bucket: str = "ticketly-documents"


settings = Settings()
