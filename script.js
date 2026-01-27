const SUPABASE_URL = 'https://noawhiwgihrcqygsmjed.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYXdoaXdnaWhyY3F5Z3NtamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTkzMzUsImV4cCI6MjA4NDc3NTMzNX0.MPeLwmSh5Vx12J470W_tbojh5JoUJIhSa0V-Q_a20ow';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadContent() {
    const container = document.getElementById('main-container');
    container.innerHTML = '<p style="text-align:center">Завантаження дискусій...</p>';

    const { data: topics, error: tError } = await supabaseClient
        .from('topics')
        .select('*')
        .eq('status', 'active')
        .order('id', { ascending: true });

    if (tError) {
        console.error('Помилка тем:', tError);
        container.innerHTML = '<p>Помилка завантаження.</p>';
        return;
    }

    container.innerHTML = '';

    for (const topic of topics) {
        const topicBlock = document.createElement('div');
        topicBlock.className = 'topic-block';
        topicBlock.style.marginBottom = '4rem';

        topicBlock.innerHTML = `
            <div class="topic-header">
                <span style="color: var(--accent)">Тема #${topic.id}:</span>
                <h2>${topic.title}</h2>
                <p>${topic.description}</p>
            </div>
            <div class="debate-grid" id="grid-${topic.id}">
                </div>
            <button class="btn-action" onclick="addIdea(${topic.id})">
                + Додати аргумент до цієї теми
            </button>
        `;
        
        container.appendChild(topicBlock);

        await loadArguments(topic.id);
    }
}

async function loadArguments(topicId) {
    const { data: args, error } = await supabaseClient
        .from('arguments')
        .select('*')
        .eq('topic_id', topicId);

    const grid = document.getElementById(`grid-${topicId}`);
    
    if (args && grid) {
        grid.innerHTML = '';
        args.forEach(arg => {
            const typeClass = arg.arg_type === 'con' ? 'contra' : arg.arg_type;
            
            const card = `
                <div class="argument-card ${typeClass}">
                    <span class="badge badge-${typeClass}">${arg.badge_text || 'Думка'}</span>
                    <h3>${arg.title || 'Без заголовку'}</h3>
                    <p>${arg.content}</p>
                    <small style="color: var(--text-muted)">
                        Автор: ${arg.author_name} | Репутація: +${arg.reputation || 0}
                    </small>
                </div>
            `;
            grid.innerHTML += card;
        });
    }
}

async function addIdea(topicId) {
    const text = prompt("Введіть ваш аргумент:");
    if (!text) return;

    const typeInput = prompt("Тип аргументу (введіть 'pro' або 'contra'):");
    const safeType = (typeInput === 'contra') ? 'contra' : 'pro';

    const { data, error } = await supabaseClient
        .from('arguments')
        .insert([
            { 
                topic_id: topicId, 
                content: text, 
                arg_type: safeType,
                title: 'Нова думка',
                badge_text: 'Користувач',
                author_name: 'Гість'
            }
        ]);

    if (error) {
        alert("Помилка при збереженні: " + error.message);
    } else {
        alert("Аргумент додано! Оновіть сторінку.");
        loadArguments(topicId);
    }
}

loadContent();