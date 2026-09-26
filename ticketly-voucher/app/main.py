import asyncio
import logging
import signal

from app.config import settings

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(settings.service_name)


async def main() -> None:
    # Esqueleto: só sobe e espera o sinal de parada.
    # O consumer do RabbitMQ entra aqui quando o ticketly-infra existir.
    stop = asyncio.Event()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)

    logger.info(
        "Worker iniciado (fila=%s, exchange=%s)",
        settings.rabbitmq_queue,
        settings.rabbitmq_exchange,
    )
    await stop.wait()
    logger.info("Worker encerrado")


if __name__ == "__main__":
    asyncio.run(main())
