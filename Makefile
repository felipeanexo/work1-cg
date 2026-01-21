.PHONY: run stop restart open test clean help

PORT ?= 8088
PIDFILE := /tmp/work1_server.pid
LOGFILE := /tmp/work1_server.log

help:
	@echo "Makefile para testar o projeto de Computação Gráfica"
	@echo ""
	@echo "Targets disponíveis:"
	@echo "  make run     - Inicia o servidor HTTP na porta $(PORT)"
	@echo "  make stop    - Para o servidor HTTP"
	@echo "  make restart - Reinicia o servidor HTTP"
	@echo "  make open    - Abre http://localhost:$(PORT) no navegador"
	@echo "  make test    - Verifica se os arquivos necessários existem"
	@echo "  make clean   - Remove arquivos temporários (PID, logs)"
	@echo "  make help    - Mostra esta mensagem"
	@echo ""
	@echo "Exemplo: make run open"

run: test
	@set -eu; \
	PID_ON_PORT=$$(ss -ltnp 2>/dev/null | sed -n '/:$(PORT)[[:space:]]/{s/.*pid=\\([0-9]\\+\\).*/\\1/p;q}' || true); \
	if [ -n "$$PID_ON_PORT" ] && [ ! -f $(PIDFILE) ]; then \
		echo "Servidor já está rodando na porta $(PORT) (PID: $$PID_ON_PORT)"; \
		echo "  Acesse: http://localhost:$(PORT)"; \
		exit 0; \
	fi; \
	if [ -f $(PIDFILE) ] && ps -p $$(cat $(PIDFILE)) > /dev/null 2>&1; then \
		echo "Servidor já está rodando (PID: $$(cat $(PIDFILE)))"; \
		echo "  Acesse: http://localhost:$(PORT)"; \
		exit 0; \
	fi; \
	if [ -f $(PIDFILE) ]; then rm -f $(PIDFILE); fi; \
	echo "Iniciando servidor HTTP na porta $(PORT)..."; \
	python3 -m http.server $(PORT) > $(LOGFILE) 2>&1 & \
		echo $$! > $(PIDFILE); \
	sleep 0.5; \
	if ps -p $$(cat $(PIDFILE)) > /dev/null 2>&1; then \
		echo "✓ Servidor iniciado (PID: $$(cat $(PIDFILE)))"; \
		echo "  Acesse: http://localhost:$(PORT)"; \
	else \
		echo "✗ Erro ao iniciar servidor. Verifique $(LOGFILE)"; \
		rm -f $(PIDFILE); \
		exit 1; \
	fi

stop:
	@set -eu; \
	PID=""; \
	if [ -f $(PIDFILE) ]; then PID=$$(cat $(PIDFILE) 2>/dev/null); fi; \
	if [ -z "$$PID" ]; then \
		PID=$$(ss -ltnp 2>/dev/null | sed -n '/:$(PORT)[[:space:]]/{s/.*pid=\\([0-9]\\+\\).*/\\1/p;q}' || true); \
	fi; \
	if [ -z "$$PID" ]; then \
		echo "Nenhum servidor em execução (nada encontrado em $(PIDFILE) e nada ouvindo em :$(PORT))"; \
		exit 0; \
	fi; \
	if ps -p $$PID > /dev/null 2>&1; then \
		kill $$PID && echo "✓ Servidor parado (PID: $$PID)"; \
	else \
		echo "Processo não encontrado (PID: $$PID)"; \
	fi; \
	rm -f $(PIDFILE)

restart:
	@$(MAKE) stop
	@$(MAKE) run

open:
	@if [ -f $(PIDFILE) ] && ps -p $$(cat $(PIDFILE)) > /dev/null 2>&1; then \
		echo "Abrindo http://localhost:$(PORT) no navegador..."; \
		xdg-open http://localhost:$(PORT) 2>/dev/null || \
		open http://localhost:$(PORT) 2>/dev/null || \
		echo "Não foi possível abrir o navegador automaticamente. Acesse: http://localhost:$(PORT)"; \
	else \
		echo "Servidor não está rodando. Execute 'make run' primeiro."; \
		exit 1; \
	fi

test:
	@echo "Verificando arquivos necessários..."
	@missing=0; \
	for file in index.html main-app.js; do \
		if [ -f "$$file" ]; then \
			echo "  ✓ $$file"; \
		else \
			echo "  ✗ $$file (FALTANDO)"; \
			missing=1; \
		fi; \
	done; \
	if [ $$missing -eq 1 ]; then \
		echo ""; \
		echo "Erro: Alguns arquivos estão faltando!"; \
		exit 1; \
	fi; \
	echo "✓ Todos os arquivos necessários estão presentes"

clean:
	@echo "Limpando arquivos temporários..."
	@if [ -f $(PIDFILE) ]; then \
		PID=$$(cat $(PIDFILE) 2>/dev/null); \
		if [ -n "$$PID" ] && ps -p $$PID > /dev/null 2>&1; then \
			echo "  Parando servidor (PID: $$PID)..."; \
			kill $$PID 2>/dev/null || true; \
		fi; \
		rm -f $(PIDFILE); \
		echo "  ✓ Removido $(PIDFILE)"; \
	fi
	@if [ -f $(LOGFILE) ]; then \
		rm -f $(LOGFILE); \
		echo "  ✓ Removido $(LOGFILE)"; \
	fi
	@echo "✓ Limpeza concluída"
