class EvidenceSystem {
    constructor() {
        this.evidence = [];
        this.items = [];
        this.notes = [];
        this.currentTab = 'evidence';
    }
    
    collectEvidence(evidenceItem) {
        this.evidence.push(evidenceItem);
        console.log('Evidence collected:', evidenceItem.name);
        // Show notification
        this.showNotification(`Evidence collected: ${evidenceItem.name}`);
    }
    
    addItem(item) {
        this.items.push(item);
        console.log('Item added:', item.name);
        this.showNotification(`Item acquired: ${item.name}`);
    }
    
    addNote(note) {
        this.notes.push(note);
        console.log('Note added:', note.title);
    }
    
    hasItem(itemName) {
        return this.items.some(item => item.name === itemName);
    }
    
    showInventory() {
        const panel = document.getElementById('inventory-panel');
        panel.classList.remove('hidden');
        this.renderInventoryContent();
    }
    
    hideInventory() {
        document.getElementById('inventory-panel').classList.add('hidden');
    }
    
    renderInventoryContent() {
        const content = document.getElementById('inventory-content');
        content.innerHTML = '';
        
        let items;
        switch(this.currentTab) {
            case 'evidence':
                items = this.evidence;
                break;
            case 'items':
                items = this.items;
                break;
            case 'notes':
                items = this.notes;
                break;
        }
        
        if (items.length === 0) {
            content.innerHTML = '<p style="color: #666; text-align: center; padding: 50px;">No items yet</p>';
            return;
        }
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            itemEl.innerHTML = `
                <div class="item-name">${item.name || item.title}</div>
                <div class="item-description">${item.description || item.content}</div>
            `;
            content.appendChild(itemEl);
        });
    }
    
    showNotification(message) {
        // Simple notification - can be enhanced
        console.log('NOTIFICATION:', message);
        // TODO: Add visual notification system
    }
}
