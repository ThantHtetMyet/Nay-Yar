import 'package:flutter/material.dart';
import 'package:sg_nay_yar/models/mrt_station.dart';

class MRTSearchDropdown extends StatefulWidget {
  final String selectedMrt;
  final Function(String) onMrtSelected;
  final VoidCallback onSearchPressed;
  final VoidCallback onClearPressed;
  final bool isSearching;
  final String searchQuery;
  final Function(String) onSearchQueryChanged;
  final bool isOpen;
  final VoidCallback onToggle;

  const MRTSearchDropdown({
    super.key,
    required this.selectedMrt,
    required this.onMrtSelected,
    required this.onSearchPressed,
    required this.onClearPressed,
    required this.isSearching,
    required this.searchQuery,
    required this.onSearchQueryChanged,
    required this.isOpen,
    required this.onToggle,
  });

  @override
  State<MRTSearchDropdown> createState() => _MRTSearchDropdownState();
}

class _MRTSearchDropdownState extends State<MRTSearchDropdown> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.searchQuery;
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  List<String> get filteredMrtStations {
    if (widget.searchQuery.isEmpty) {
      return mrtStations;
    }
    return mrtStations.where((station) =>
        station.toLowerCase().contains(widget.searchQuery.toLowerCase())
    ).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Dropdown trigger
        GestureDetector(
          onTap: widget.onToggle,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[400]!),
              borderRadius: BorderRadius.circular(4),
              color: Colors.white,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.selectedMrt,
                  style: TextStyle(
                    color: widget.selectedMrt == 'Select MRT Station' 
                        ? Colors.grey[600] 
                        : Colors.black87,
                    fontSize: 16,
                  ),
                ),
                Icon(
                  widget.isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  color: Colors.grey[600],
                ),
              ],
            ),
          ),
        ),
        
        if (widget.isOpen) ...[
          const SizedBox(height: 8),
          // Search box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(4),
              color: Colors.grey[50],
            ),
            child: TextField(
              controller: _searchController,
              focusNode: _searchFocusNode,
              decoration: const InputDecoration(
                hintText: 'Type station name...',
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                isDense: true,
              ),
              onChanged: widget.onSearchQueryChanged,
            ),
          ),
          
          const SizedBox(height: 8),
          // Station list
          Container(
            height: 200,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(4),
              color: Colors.white,
            ),
            child: filteredMrtStations.isEmpty
                ? const Center(
                    child: Text('No stations found'),
                  )
                : ListView.builder(
                    itemCount: filteredMrtStations.length,
                    itemBuilder: (context, index) {
                      final station = filteredMrtStations[index];
                      return ListTile(
                        title: Text(
                          station,
                          style: TextStyle(
                            color: station == widget.selectedMrt 
                                ? Colors.blue 
                                : Colors.black87,
                            fontWeight: station == widget.selectedMrt 
                                ? FontWeight.bold 
                                : FontWeight.normal,
                          ),
                        ),
                        onTap: () => widget.onMrtSelected(station),
                        dense: true,
                      );
                    },
                  ),
          ),
          
          const SizedBox(height: 12),
          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.onClearPressed,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.grey[400]!),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text(
                    'Clear & Close',
                    style: TextStyle(color: Colors.black87),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: widget.isSearching ? null : widget.onSearchPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.withValues(alpha: 0.45),
                    foregroundColor: const Color(0xFF1c2433),
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.8)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: widget.isSearching
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Search Area'),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}